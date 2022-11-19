import React, { useContext, useEffect, useState } from 'react';
import { Redirect, RouteComponentProps } from 'react-router';
import {
  IonContent,
  IonBadge,
  IonFab,
  IonFabButton,
  IonButton,
  IonHeader,
  IonIcon,
  IonList, IonLoading,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSearchbar,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption
} from '@ionic/react';
import { add } from 'ionicons/icons';
import Item from './Item';
import { getLogger } from '../core';
import { ItemContext } from './ItemProvider';
import { AuthContext } from '../auth'
import { Network, NetworkStatus } from '@capacitor/core';
import { IonInfiniteScroll, IonInfiniteScrollContent} from '@ionic/react';
import { ItemProps } from './ItemProps';
import {type} from "os";
import {useNetwork} from "../utils/useNetwork";


const log = getLogger('ItemList');



const ItemList: React.FC<RouteComponentProps> = ({ history }) => {

  const {networkStatus} = useNetwork();
  const stringStatus = (status: any) => status.connected ? "Online" : "Offline"
  const[disableInfiniteScroll, setDisableInfiniteScroll] = useState<boolean>(false);
  const[filter, setFilter] = useState<string | undefined>("any pages");
  const selectOptions = ["<=500 pages", ">500 pages", "any pages"];
  const [searchText, setSearchText] = useState<string>("");
  const renderColor = () => {
    return stringStatus(networkStatus) === "Online" ? "primary" : "danger";
  }

  const renderStatus = () => {
    return stringStatus(networkStatus);
  }


  const networkStatusView = <IonBadge className="status" color = { renderColor() } style={{marginLeft: "2rem"}}>Network status: { renderStatus() }</IonBadge>
  const { logout } = useContext(AuthContext);
  const handleLogout = () => {
    logout?.();
    return <Redirect to={{pathname: "/login"}} />;
  }
  const { items, fetching, fetchingError, savingError} = useContext(ItemContext);
  const[pos, setPos] = useState(5);
  const [booksShow, setBooksShow] = useState<ItemProps[]>([]);
  

  async function searchNext($event: CustomEvent<void>)
  {
    if(items && pos < items.length){
      setBooksShow([...items.slice(0, 5+pos)]);
      setPos(pos+5);
    }
    else{
      setDisableInfiniteScroll(true);
    }
    log("items from" + 0 + "to " + pos)
    log(booksShow)
    await ($event.target as HTMLIonInfiniteScrollElement).complete();
  }

  log('render');
  useEffect(() =>{
    if(items?.length){
      setBooksShow(items.slice(0, pos));
    }
  }, [ pos]);

  useEffect(()=>{
    if(filter && items){
      if(filter === "<=500 pages"){
        setBooksShow(items.filter((item) => item.pages <= 500) );
      }
      else if(filter === ">500 pages"){
        setBooksShow(items.filter((item) => item.pages > 500) );
      }
      else if(filter === "any pages"){
        setBooksShow(items);
      }
    }
  }, [filter]);

  //search
  useEffect(()=>{
    if(searchText === "" && items){
      setBooksShow(items);

    }
    if(searchText && items){
      setBooksShow(items.filter((item) => item.name.startsWith(searchText)));
    }
  },[searchText]);
  //log("ITEM LIST!!!!!!!!!!!!!!" + Array.isArray(items))
  //log(items)
  //log("IM HERE!!!!!!!!" + Array.isArray(booksShow));
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButton slot="end" onClick = {handleLogout}>Logout</IonButton>
          <IonTitle>My Books</IonTitle>
          { networkStatusView }
        </IonToolbar>
        <IonSearchbar className="searchBar" value={searchText} debounce={500} onIonChange={(e) => setSearchText(e.detail.value!)}/>
        <IonItem className="filterBar">
            <IonLabel>Filter products by pages</IonLabel>
            <IonSelect value={filter} onIonChange={(e) => setFilter(e.detail.value)}>
                {selectOptions.map((option) => (
                <IonSelectOption key={option} value={option}>
                    {option}
                </IonSelectOption>
                ))}
            </IonSelect>
        </IonItem>
      </IonHeader>

      <IonContent>

        <IonLoading isOpen={fetching} message="Fetching items" />
        {items && (  //aici de rezolvat cumva
          <IonList>
            {items && booksShow.map((item: ItemProps) =>

              <Item key={item._id} _id={item._id} name={item.name}  onEdit={id => history.push(`/item/${id}`)} author={item.author} available={item.available} publish_date={item.publish_date} pages={item.pages} />
            )}
          </IonList>

      )}
      <IonInfiniteScroll threshold="75px" disabled={disableInfiniteScroll} onIonInfinite={(e: CustomEvent<void>) => searchNext(e)}>
            <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading for more items..."/>
        </IonInfiniteScroll>
        {savingError &&(
            <div>{'Failed to save item to server - saving it locally'}</div>
        )}
        {fetchingError && (
          <div>{fetchingError.message || 'Failed to fetch items'}</div>
        )}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push('/item')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default ItemList;
