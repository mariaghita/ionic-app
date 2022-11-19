import React, { useCallback, useContext, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../core';
import { ItemProps } from './ItemProps';
import { createItem, getItems, newWebSocket, updateItem } from './itemApi';
import { AuthContext } from '../auth';
import { Plugins } from '@capacitor/core';
import {useNetwork} from "../utils/useNetwork";

const log = getLogger('ItemProvider');

const {Storage} = Plugins;


type SaveItemFn = (item: ItemProps) => Promise<any>;

export interface ItemsState {
  items?: ItemProps[],
  failCount: number,
  fetching: boolean,
  fetchingError?: Error | null,
  saving: boolean,
  savingError?: Error | null,
  saveItem?: SaveItemFn,

}

interface ActionProps {
  type: string,
  payload?: any,
}

const initialState: ItemsState = {
  failCount : 0,
  fetching: false,
  saving: false,
};

const FETCH_ITEMS_STARTED = 'FETCH_ITEMS_STARTED';
const FETCH_ITEMS_SUCCEEDED = 'FETCH_ITEMS_SUCCEEDED';
const FETCH_ITEMS_FAILED = 'FETCH_ITEMS_FAILED';
const SAVE_ITEM_STARTED = 'SAVE_ITEM_STARTED';
const SAVE_ITEM_SUCCEEDED = 'SAVE_ITEM_SUCCEEDED';
const SAVE_ITEM_FAILED = 'SAVE_ITEM_FAILED';
const DELETE_DUPLICATE = 'DELETE_DUPLICATE';

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
        const index = items.findIndex(it => it._id === item._id);
        if (index === -1) {
          items.splice(0, 0, item);
        } else {
          items[index] = item;
        }
        return { ...state, items, saving: false};
      case SAVE_ITEM_FAILED:{
        const failedItem = payload.item;
        const failCount = state.failCount + 1;
        if(!failedItem._id){
          failedItem._failed=true;
          failedItem._id = failCount.toString();
        }
        const failedItems = [...(state.items || [])];
        const failedIndex = failedItems.findIndex(it => it._id === failedItem._id);
        if(failedIndex === -1){
          failedItems.splice(0,0,failedItem);
        }else{
          failedItems[failedIndex] = failedItem;
        }
        return {...state, savingError: payload.error, saving: false, failCount, items: failedItems};
      }
      case DELETE_DUPLICATE:
        const duplicate=payload.item
        return {...state,items: state.items?.filter((item)=>item._id!==duplicate._id)};
      default:
        return state;
    }
  };

export const ItemContext = React.createContext<ItemsState>(initialState);

interface ItemProviderProps {
  children: PropTypes.ReactNodeLike,
}

export const ItemProvider: React.FC<ItemProviderProps> = ({ children }) => {
  const {networkStatus} = useNetwork();
  const {token} = useContext(AuthContext);
  const [state, dispatch] = useReducer(reducer, initialState);
  const { items, failCount, fetching, fetchingError, saving, savingError } = state;
  useEffect(getItemsEffect, [token]);
  useEffect(wsEffect, [token]);
  useEffect(()=>{if(items){saveLocalStorageItems(items)}},[items])

  useEffect(() => {
    if(networkStatus.connected){
      items?.forEach(async item => {
        if(item._failed){
          dispatch({type: DELETE_DUPLICATE, payload: {item}});
          delete item._failed
          delete item._id
        }
        saveItemCallback(item);
      })
    }
  }, [networkStatus])

  const saveItem = useCallback<SaveItemFn>(saveItemCallback, [token]);
  const value = { items,failCount, fetching, fetchingError, saving, savingError, saveItem };
  log('returns');
  return (
    <ItemContext.Provider value={value}>
      {children}
    </ItemContext.Provider>
  );

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
        //const items = await getItems((await Storage.get({key: 'token'})).value);
        let items = await getLocalStorageItems();
        if(!items){
          items = await getItems(token);
        }
        await saveLocalStorageItems(items);
        log('fetchItems succeded');
        if(!canceled){
          dispatch({type: FETCH_ITEMS_SUCCEEDED, payload: {items}});
        }
      }catch (error){
        log('fetchItems failed');
        dispatch({type: FETCH_ITEMS_FAILED, payload: {error}});
      }
  }
}

  async function getLocalStorageItems(){
    return JSON.parse((await Storage.get({
      key: 'items',
    })).value as string);
  }

  async function saveLocalStorageItems(items:ItemProps[]){
    await Storage.set({
      key: 'items',
      value: JSON.stringify(items)
    });
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
      dispatch({ type: SAVE_ITEM_FAILED, payload: {error, item} });
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
