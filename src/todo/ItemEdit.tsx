import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonDatetime,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonLoading,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import { getLogger } from '../core';
import { ItemContext } from './ItemProvider';
import { RouteComponentProps } from 'react-router';
import { ItemProps } from './ItemProps';

const log = getLogger('ItemEdit');

interface ItemEditProps extends RouteComponentProps<{
  id?: string;
  
}> {}

const ItemEdit: React.FC<ItemEditProps> = ({ history, match }) => {
  const { items, saving, savingError, saveItem } = useContext(ItemContext);
  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [available, setAvailability] = useState(true);
  const [publish_date, setDate] = useState(new Date(Date.now()));
  const [pages, setPages] = useState(0);
  const [item, setItem] = useState<ItemProps>();
  
  useEffect(() => {
    log('useEffect');
    const routeId = match.params.id || '';
    const item = items?.find(it => it._id === routeId);
    setItem(item);
    if (item) {
      setName(item.name);
      setAuthor(item.author);
      setAvailability(item.available);
      setDate(item.publish_date);
      setPages(item.pages);
      
    }
  }, [match.params.id, items]);
  const handleSave = useCallback(() => {
    const editedItem = item ? { ...item, name, author, available, pages, publish_date } : { name, author, available, pages, publish_date };
    saveItem && saveItem(editedItem).then(() => history.goBack());
  }, [item, saveItem, name, author, available, pages, publish_date,  history]);
  log('render');
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Edit Book</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSave}>
              Save Book
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent class='ion-text-center'>
        <IonItem>
          <IonLabel>Name: </IonLabel><IonInput class='ion-text-right' value={name} onIonChange={e => setName(e.detail.value || '')} />
        </IonItem>
        <IonItem>
          <IonLabel>Author: </IonLabel><IonInput class='ion-text-right' value={author} onIonChange={e => setAuthor(e.detail.value || '')} />
        </IonItem>
        <IonItem>
          <IonLabel>Available: </IonLabel><IonCheckbox checked={available} onIonChange={e => setAvailability(e.detail.checked)} />
        </IonItem>
        <IonItem>
          <IonLabel>Number of pages: </IonLabel><IonInput class='ion-text-right' type='number' value={pages} onIonChange={e => setPages(parseInt((e.detail.value || 0).toString()))} />
        </IonItem>
        <IonItem>
          <IonLabel>Publish date: </IonLabel><IonDatetime value={publish_date.toString()} onIonChange={e => setDate(new Date(e.detail.value || new Date(Date.now())))} />
        </IonItem>
        <IonLoading isOpen={saving} />
        {savingError && (
          <div>{savingError.message || 'Failed to save item'}</div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ItemEdit;
