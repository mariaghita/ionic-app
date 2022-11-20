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
import {PhotoModal} from "../components/PhotoModal";
import {usePhotoGallery} from "../hooks/usePhotoGallery";
import {useMyLocation} from "../hooks/useMyLocation";
import {MyMap} from "../components/MyMap";
import {createAnimation, Animation} from "@ionic/core";

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
  const [photoBase64, setPhotoBase64] = useState('');
  const [pages, setPages] = useState(0);
  const [latitude, setLatitude] = useState(44);
  const [longitude, setLongitude] = useState(26);
  const [item, setItem] = useState<ItemProps>();
  const {takePhotoBase64} = usePhotoGallery();
  const [mapVisible, setMapVisible] = useState(false);
  const myLocation = useMyLocation();

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
      setPhotoBase64(item.photoBase64);
      setLatitude(item.latitude);
      setLongitude(item.longitude);
      
    }
  }, [match.params.id, items]);
  const handleSave = useCallback(() => {
    const editedItem = item ? { ...item, name, author, available, pages, publish_date, photoBase64, latitude, longitude } : { name, author, available, pages, publish_date, photoBase64, latitude, longitude };
    saveItem && saveItem(editedItem).then(() => history.goBack());
  }, [item, saveItem, name, author, available, pages, publish_date, photoBase64, latitude, longitude, history]);

  useEffect(simpleAnimation, []);
  log('render');
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <div className={"animatedElement"}>
          <IonTitle>Edit Book</IonTitle>
          </div>
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
        <IonButton onClick={ () => {
          let loc = myLocation.position?.coords;
          setLongitude(loc?.longitude ?? 0);
          setLatitude(loc?.latitude ?? 0);
        }}>
          Use Current Location
        </IonButton>
        <IonButton onClick={() => setMapVisible(!mapVisible)}>
          Edit Location
        </IonButton>
        <IonButton onClick={
          async () => setPhotoBase64(await takePhotoBase64(item?._id ?? "Unknown"))
        }>
          Take Photo
        </IonButton>
        {console.log(photoBase64)}
        <PhotoModal base64Data={photoBase64}/>
        { mapVisible &&
            <MyMap
                lat={latitude ?? 0}
                lng={longitude ?? 0}
                onMapClick={
                  (e: any) => {
                    console.log(e.latLng.lat())
                    console.log(e.latLng.lng())
                    setLatitude(e.latLng.lat())
                    setLongitude(e.latLng.lng())
                  }
                }
                onMarkerClick={log('onMarker')}
            />
        }
        <IonLoading isOpen={saving} />
        {savingError && (
          <div>{savingError.message || 'Failed to save item'}</div>
        )}
      </IonContent>
    </IonPage>
  );
};
function simpleAnimation() {
  const el = document.querySelector(".animatedElement");
  if(el){
    const animation = createAnimation()
        .addElement(el)
        .duration(5000)
        .direction("alternate")
        .iterations(2)
        .keyframes([
          { offset: 0, transform: 'scale(1)', opacity: '1' },
          { offset: 0.5, transform: 'scale(0.5)', opacity: '1' },
          {
            offset: 1, transform: 'scale(1.5)', opacity: '0.2'
          }
        ]);
    animation.play();
  }
}


export default ItemEdit;
