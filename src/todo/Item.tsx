import React, { useCallback } from 'react';
import { IonCheckbox, IonItem, IonLabel } from '@ionic/react';
import { ItemProps } from './ItemProps';

interface ItemPropsExt extends ItemProps {
  onEdit: (id?: string) => void;
}

const Item: React.FC<ItemPropsExt> = ({ _id, name, onEdit }) => {
  const handleEdit = useCallback(() => onEdit(_id), [_id, onEdit]);
  return (
    <IonItem onClick={handleEdit}>
      <IonLabel>{name}</IonLabel>
    </IonItem>
  );
};

export default Item;
