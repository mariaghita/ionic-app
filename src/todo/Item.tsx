import React, { useCallback } from 'react';
import {IonCheckbox, IonItem, IonLabel, IonRow} from '@ionic/react';
import { ItemProps } from './ItemProps';
import {PhotoModal} from "../components/PhotoModal";

interface ItemPropsExt extends ItemProps {
  onEdit: (id?: string) => void;
}

const Item: React.FC<ItemPropsExt> = ({ _id, name, photoBase64,onEdit }) => {
  const handleEdit = useCallback(() => onEdit(_id), [_id, onEdit]);
  return (
      <IonRow>
        <IonItem onClick={handleEdit}>
          <IonLabel>{name}</IonLabel>
        </IonItem>
        <PhotoModal base64Data={photoBase64}/>
      </IonRow>
  );
};

export default Item;
