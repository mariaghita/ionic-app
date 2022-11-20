import React, {useCallback, useState} from 'react';
import {IonButton, IonCheckbox, IonItem, IonLabel, IonRow} from '@ionic/react';
import { ItemProps } from './ItemProps';
import {PhotoModal} from "../components/PhotoModal";
import {MyMap} from "../components/MyMap";

interface ItemPropsExt extends ItemProps {
  onEdit: (id?: string) => void;
}

const Item: React.FC<ItemPropsExt> = ({ _id, name, photoBase64,longitude, latitude, onEdit }) => {
  const handleEdit = useCallback(() => onEdit(_id), [_id, onEdit]);
  const [mapVisible, setMapVisible] = useState(false);
  return (
      <div>
      <IonRow>
        <IonItem onClick={handleEdit}>
          <IonLabel>{name}</IonLabel>
        </IonItem>
          <PhotoModal base64Data={photoBase64}/>
          <IonButton onClick={() => setMapVisible(!mapVisible)}>
              View Map
          </IonButton>
      </IonRow>
    {mapVisible &&
        <MyMap
            lat={latitude ?? 0}
            lng={longitude ?? 0}
            />
    }
      </div>
  );
};

export default Item;
