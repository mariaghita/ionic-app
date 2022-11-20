import React, {useState} from "react";
import {IonButton, IonImg, IonModal} from "@ionic/react";

export const PhotoModal: React.FC<{base64Data: string}> = ({base64Data}) => {
    const [showModal, setShowModal] = useState(false);

    return(
        <>
            <IonModal isOpen={showModal}>
                <IonImg src={"data:image/jpeg;base64," + base64Data}/>
                <IonButton onClick={() => setShowModal(false)}>
                    Close photo
                </IonButton>
            </IonModal>
            <IonButton onClick={() => setShowModal(true)} disabled={(base64Data ?? "") === ""}>
                View Photo
            </IonButton>
        </>
    );
}