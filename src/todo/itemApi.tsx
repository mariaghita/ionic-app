import { Network } from '@capacitor/core';
import axios from 'axios';
import { stat } from 'fs';
import { getLogger, authConfig, withLogs } from '../core';
import { ItemProps } from './ItemProps';
import { Storage } from '@capacitor/core';

const log = getLogger('itemApi');

const baseUrl = 'localhost:3000';
const itemUrl = `http://${baseUrl}/api/item`;

const config = {
  headers: {
    'Content-Type': 'application/json'
  }
};

export const getItem: (id: string | undefined) => Promise<ItemProps> = id => {
  return withLogs(axios.get(`${itemUrl}/${id}`, config), 'getItem');
}

export const getItems: (token: string | null) => Promise<ItemProps[]> = token => {
  return withLogs(axios.get(itemUrl, authConfig(token)), 'getItems');
}

export const createItem: (token: string, item: ItemProps) => Promise<ItemProps[]> = (token, item) => {
  return withLogs(axios.post(itemUrl, item, authConfig(token)), 'createItem');
}

export const updateItem: (token: string, item: ItemProps) => Promise<ItemProps[]> = (token, item) => {
  var result = axios.put(`${itemUrl}/${item._id}`, item, authConfig(token));
  Network.getStatus().then(async status => {
    if(status.connected === false){
      await Storage.set(
        {
          key: "item_save" + item._id,
          value: JSON.stringify({
            name: item.name,
            author: item.author,
            available: item.available,
            publish_date: item.publish_date,
            pages: item.pages,
            version: item.version
          })
        }
      )
    }
  })
  return withLogs(result, 'updateItem');
}

interface MessageData {
  type: string;
  payload: ItemProps;
}

export const newWebSocket = (token: string, onMessage: (data: MessageData) => void) => {
  const ws = new WebSocket(`ws://${baseUrl}`)
  ws.onopen = () => {
    log('web socket onopen');
    ws.send(JSON.stringify({type: 'authorization', payload: {token}}))
  };
  ws.onclose = () => {
    log('web socket onclose');
  };
  ws.onerror = error => {
    log('web socket onerror', error);
  };
  ws.onmessage = messageEvent => {
    log('web socket onmessage');
    onMessage(JSON.parse(messageEvent.data));
  };
  return () => {
    ws.close();
  }
}