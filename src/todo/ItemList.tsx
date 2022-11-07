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
import { useNetwork } from '../utils/useNetwork';

const log = getLogger('ItemList');

let NStatus = "Online";



Network.addListener("networkStatusChange", status => {
  NStatus = status.connected === true ? "Online" : "Offline";
  log(NStatus, "in listener");
})

const ItemList: React.FC<RouteComponentProps> = ({ history }) => {
  
  const [networkStatus, setNetworkStatus] = useState<string>(NStatus);
  Network.addListener("networkStatusChange", status => {
    setNetworkStatus(status.connected === true ? "Online" : "Offline");
    log(networkStatus, "in listener");
  })
  const[disableInfiniteScroll, setDisableInfiniteScroll] = useState<boolean>(false);
  const[filter, setFilter] = useState<string | undefined>("any pages");
  const selectOptions = ["<=500 pages", ">500 pages", "any pages"];
  const [searchText, setSearchText] = useState<string>("");
  const renderColor = () => {
    return networkStatus === "Online" ? "primary" : "danger";
  }

  const renderStatus = () => {
    return networkStatus;
  }


  const networkStatusView = <IonBadge className="status" color = { renderColor() } style={{marginLeft: "2rem"}}>Network status: { renderStatus() }</IonBadge>
  const { logout } = useContext(AuthContext);
  const handleLogout = () => {
    logout?.();
    return <Redirect to={{pathname: "/login"}} />;
  }
  const { items, fetching, fetchingError, savingPending, saveItem, conflictualItems } = useContext(ItemContext);
  const[pos, setPos] = useState(5);
  const [booksShow, setBooksShow] = useState<ItemProps[]>([]);
  const[conflict, setConflict] = useState<boolean>(false);

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
  }, [items]);

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
    
  useEffect(() => {
    if(savingPending === true){
      setConflict(true);
    }
    else{
      setConflict(false);
    }
  }, [savingPending]);

  async function handleEdit(id : string | undefined) {
    const item = conflictualItems?.find(it => it._id === id);
    if(item && item._id){
        console.log(item);
        item._id = item._id.split('_')[0];
        item.version = item.version + 1;
        console.log(item);
        saveItem && saveItem(item);
    }
    return;

  }


  if(conflict === true){
    return(
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle> BooksApp - server is offline </IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonLabel>Te adaug io cand mergi</IonLabel>
        </IonContent>
      </IonPage>
    )
  }else

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
        {items && booksShow.map((item: ItemProps) => {
          return(
          <IonList>
            <div className="item">
            
              <Item key={item._id} _id={item._id} name={item.name}  onEdit={id => history.push(`/item/${id}`)} author={item.author} available={item.available} publish_date={item.publish_date} pages={item.pages} version={item.version} />
            </div>
          </IonList>
          );
      })}
      <IonInfiniteScroll threshold="75px" disabled={disableInfiniteScroll} onIonInfinite={(e: CustomEvent<void>) => searchNext(e)}>
            <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading for more items..."/>
        </IonInfiniteScroll>
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
