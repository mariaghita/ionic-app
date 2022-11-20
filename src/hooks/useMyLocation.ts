import {Geolocation, GeolocationPosition} from "@capacitor/core";
import {useEffect, useState} from "react";

interface MyLocation{
    position?: GeolocationPosition;
    error?: Error;
}

export const useMyLocation = () => {
    const [state, setState] = useState<MyLocation>({});
    useEffect(watchLocation, []);
    return state;

    function watchLocation(){
        let canceled = false;
        Geolocation.getCurrentPosition()
            .then(position => updateMyPosition('current', position))
            .catch(error => updateMyPosition('current', undefined, error));

        const callbackId = Geolocation.watchPosition({}, (position, error) => {
           updateMyPosition('watch', position, error);
        });
        return () => {
            canceled = true;
            Geolocation.clearWatch({ id: callbackId });
        };
        function updateMyPosition(source: string, position?: GeolocationPosition, error: any = undefined) {
            console.log(source, position, error);
            if (!canceled) {
                setState({ ...state, position: position || state.position, error });
            }
        }
    }
}