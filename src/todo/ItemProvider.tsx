import React, { useCallback, useContext, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../core';
import { ItemProps } from './ItemProps';
import { createItem, getItem, getItems, newWebSocket, updateItem } from './itemApi';
import { AuthContext } from '../auth';
import { Plugins } from '@capacitor/core';

const log = getLogger('ItemProvider');
const { Network } = Plugins;
const {Storage} = Plugins;





type SaveItemFn = (item: ItemProps) => Promise<any>;

export interface ItemsState {
  items?: ItemProps[],
  conflictualItems?: ItemProps[],
  fetching: boolean,
  fetchingError?: Error | null,
  saving: boolean,
  savingError?: Error | null,
  saveItem?: SaveItemFn,
  savingPending: boolean,
}

interface ActionProps {
  type: string,
  payload?: any,
}

const initialState: ItemsState = {
  fetching: false,
  saving: false,
  savingPending: false,
};

const FETCH_ITEMS_STARTED = 'FETCH_ITEMS_STARTED';
const FETCH_ITEMS_SUCCEEDED = 'FETCH_ITEMS_SUCCEEDED';
const FETCH_ITEMS_FAILED = 'FETCH_ITEMS_FAILED';
const SAVE_ITEM_STARTED = 'SAVE_ITEM_STARTED';
const SAVE_ITEM_SUCCEEDED = 'SAVE_ITEM_SUCCEEDED';
const SAVE_ITEM_FAILED = 'SAVE_ITEM_FAILED';
const SAVING_PENDING = 'SAVING_PENDING';

const reducer: (state: ItemsState, action: ActionProps) => ItemsState =
  (state, { type, payload }) => {
    switch (type) {
      case FETCH_ITEMS_STARTED:
        return { ...state, fetching: true, fetchingError: null };
      case FETCH_ITEMS_SUCCEEDED:
        return { ...state, items: payload.items, fetching: false };
      case FETCH_ITEMS_FAILED:
        return { ...state, fetchingError: payload.error, fetching: false };
      case SAVE_ITEM_STARTED:
        return { ...state, savingError: null, saving: true };
      case SAVE_ITEM_SUCCEEDED:
        const items = [...(state.items || [])];
        const item = payload.item;
        const index = items.findIndex(it => it._id === item.id);
        if (index === -1) {
          items.splice(0, 0, item);
        } else {
          items[index] = item;
        }
        return { ...state, items, saving: false, savingPending: false };
      case SAVE_ITEM_FAILED:{
        const items = [...(state.items || [])];
        const item = payload.item;
        //item.status = false
        const index = items.findIndex(it => it._id === item._id);
        if(index === -1){
          items.splice(0,0,item);
        }else{
          items[index] = item;
        }
        return { ...state, items, savingError: payload.error, saving: false, savingPending: true };
      }
      case SAVING_PENDING:
        return {...state, conflictualItems: payload.conflictualItems, savingPending: true}
      default:
        return state;
    }
  };

export const ItemContext = React.createContext<ItemsState>(initialState);

interface ItemProviderProps {
  children: PropTypes.ReactNodeLike,
}

export const ItemProvider: React.FC<ItemProviderProps> = ({ children }) => {
  const {token} = useContext(AuthContext);
  const [state, dispatch] = useReducer(reducer, initialState);
  const { items, fetching, fetchingError, saving, savingError, savingPending, conflictualItems } = state;
  useEffect(getItemsEffect, [token]);
  useEffect(networkStatusEffect, []);
  useEffect(wsEffect, [token]);
  const saveItem = useCallback<SaveItemFn>(saveItemCallback, [token]);
  const value = { items, fetching, fetchingError, saving, savingError, savingPending, saveItem, conflictualItems };
  log('returns');
  return (
    <ItemContext.Provider value={value}>
      {children}
    </ItemContext.Provider>
  );
  
  function networkStatusEffect() {
    Network.addListener("networkStatusChange", status => {
      log("Network status changed: ", status);

      tryToUpdateItems();

      async function tryToUpdateItems() {
        const status = await Network.getStatus();
        if(status.connected === true){
          const { keys } = await Storage.keys();
          for(let i = 0; i < keys.length; i ++)
            if(keys[i].startsWith("item_save")){
              const toUpdate = await Storage.get({key: keys[i]});
              const toUpdateItem = JSON.parse(toUpdate.value || '{}');
              toUpdateItem.id = keys[i].split("save")[1];
  
              const existingItem = await getItem(toUpdateItem.id);
              if(existingItem.version !== toUpdateItem.version + 1){
                saveItemCallback(toUpdateItem);
              }
              else{
                toUpdateItem._id = toUpdateItem._id + "_1";
                existingItem._id = existingItem._id + "_2";
                const conflictualItems = [toUpdateItem, existingItem];
                dispatch({type: SAVING_PENDING, payload: { conflictualItems }});
              }
              await Storage.remove({key: keys[i]});
            }
        }
      }
  
      })
    }

  function getItemsEffect() {
    let canceled = false;
    fetchItems();
    return () => {
      canceled = true;
    }

    async function fetchItems() {
      if (!token?.trim()){
        return;
      }
      try {
        log('fetchItems started');
        dispatch({ type: FETCH_ITEMS_STARTED });
        const items = await getItems((await Storage.get({key: 'token'})).value);
        log('fetchItems succeeded');
        if (!canceled) {
          dispatch({ type: FETCH_ITEMS_SUCCEEDED, payload: { items } });
        }
        let allItems = {...items};

        for(let i = 0; i < items.length; i++){
          await Storage.set({
            key: "item" + allItems[i]._id,
            value: JSON.stringify({
              name: allItems[i].name,
              author: allItems[i].author,
              available: allItems[i].available,
              publish_date: allItems[i].publish_date,
              pages: allItems[i].pages,
              version: allItems[i].version
            })
          });
        }

      } catch (error) {
        log('fetchItems failed');
        const { keys } = await Storage.keys();
        let allItems = new Array();

        for(let i = 0; i < keys.length; i++){
          if(keys[i] !== 'token'){
            const ret = await Storage.get({key: keys[i]});
            const result = JSON.parse(ret.value || '{}');
            allItems.push(result)
          }
        }
        const items = allItems;

        dispatch({ type: FETCH_ITEMS_FAILED, payload: { items, error } });
      }
    }
  }

  async function saveItemCallback(item: ItemProps) {
    try {
      log('saveItem started');
      dispatch({ type: SAVE_ITEM_STARTED });
      const savedItem = await (item._id ? updateItem(token, item) : createItem(token, item));
      log('saveItem succeeded');
      dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item: savedItem } });
    } catch (error) {
      log('saveItem failed');
      dispatch({ type: SAVE_ITEM_FAILED, payload: { item, error } });
    }
  }

  function wsEffect() {
    let canceled = false;
    log('wsEffect - connecting');
    let closeWebSocket: () => void;
    if (token?.trim()) {
      closeWebSocket = newWebSocket(token, message => {
        if (canceled) {
          return;
        }
        const { type, payload: item } = message;
        log(`ws message, item ${type}`);
        if (type === 'created' || type === 'updated') {
          dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item } });
        }
      });
    }
    return () => {
      log('wsEffect - disconnecting');
      canceled = true;
      closeWebSocket?.();
      
    }
  }
};
