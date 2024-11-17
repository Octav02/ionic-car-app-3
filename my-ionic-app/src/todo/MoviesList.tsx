import React, { useContext, useEffect, useRef, useState } from 'react';
import { RouteComponentProps } from 'react-router';
import MovieComponent from './MovieComponent';
import { getLogger } from '../core';
import { MoviesContext } from './MovieProvider';
import { IonContent, 
         IonHeader, 
         IonList, 
         IonLoading, 
         IonPage, 
         IonTitle, 
         IonToolbar,
         IonToast, 
         IonFab,
         IonFabButton,
         IonIcon,
         IonButton, 
         IonButtons,
         IonInfiniteScroll,
         IonInfiniteScrollContent,
         IonSearchbar,
         IonSelect, IonSelectOption, createAnimation, 
         IonCard,
         IonCardHeader,
         IonCardTitle,
         IonCardContent} from '@ionic/react';

import { add } from 'ionicons/icons';
import { AuthContext } from '../auth';
import { NetworkState } from '../pages/NetworkState';
import { Car } from './Movie';
import './MovieList.css'; // Import the CSS file

import { GoogleMap } from '@capacitor/google-maps';
import { mapsApiKey } from '../maps/mapsApiKey';
import { MarkerClickCallbackData } from '@capacitor/google-maps/dist/typings/definitions';

const log = getLogger('MoviesList');
const carsPerPage = 5;
const filterValues = ["IsElectric", "IsNotElectric"];

export const MoviesList: React.FC<RouteComponentProps> = ({ history }) => {
  const { movies: cars, fetching, fetchingError, successMessage, closeShowSuccess } = useContext(MoviesContext);
  const { logout } = useContext(AuthContext);
  const [isOpen, setIsOpen]= useState(false);
  const [index, setIndex] = useState<number>(0);
  const [carsAux, setCarsAux] = useState<Car[] | undefined>([]);
  const [more, setHasMore] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [markerDetails, setMarkerDetails] = useState<any>(null); 

  const handleMarkerClick = async (marker: MarkerClickCallbackData) => {
    setMarkerDetails(marker);
    console.log("MARKER" + marker.title);
  };

  useEffect(simpleAnimation, []);

  useEffect(()=>{
    if(fetching) setIsOpen(true);
    else setIsOpen(false);
  }, [fetching]);

  log('render');
  console.log(cars);

  function handleLogout(){
    logout?.();
    history.push('/login');
  }

  //pagination
  useEffect(()=>{
    fetchData();
  }, [cars]);
  const [showMap, setShowMap] = useState(false);

  // searching
  useEffect(()=>{
    if (searchText === "") {
      setCarsAux(cars);
    }
    if (cars && searchText !== "") {
      setCarsAux(cars.filter(car => car.model!.startsWith(searchText)));
    }
  }, [searchText]);

   // filtering
   useEffect(() => {
    if (cars && filter) {
        setCarsAux(cars.filter(car => {
            if (filter === "IsPartOfASerie")
                return car.isElectric === true;
            else
                return car.isElectric === false;
        }));
    }
}, [filter]);

  function fetchData() {
    if(cars){
      const newIndex = Math.min(index + carsPerPage, cars.length);
      if( newIndex >= cars.length){
          setHasMore(false);
      }
      else{
          setHasMore(true);
      }
      setCarsAux(cars.slice(0, newIndex));
      setIndex(newIndex);
    }
  }

  async function searchNext($event: CustomEvent<void>){
    await fetchData();
    await ($event.target as HTMLIonInfiniteScrollElement).complete();
  }
  const mapRef = useRef<GoogleMap>();

useEffect(() => {
  const createMap = async () => {
    if (!mapRef.current) {
      const map = await GoogleMap.create({
        id: 'my-map', // Unique identifier for this map instance
        element: document.getElementById('map')!,
        apiKey: mapsApiKey, // Replace with your Google Maps API key
        config: {
          center: {
            lat: 45,
            lng: 27,
          },
          zoom: 8,
        },
      });
      mapRef.current = map;

      if (carsAux) {
        carsAux.forEach((car) => {
          map.addMarker({
            coordinate: {
              lat: car.latitude || 42,
              lng: car.longitude || 42,
            },
            title: car.model,
          });
        });

        await map.setOnMarkerClickListener((marker) => {
          handleMarkerClick(marker);
        });
      }
    }
  };
  createMap();
  return () => {
    if (mapRef.current) {
      mapRef.current.destroy();
    }
  };
}, [carsAux]);
const handleMapButtonClick = () => {
  if (showMap === false) {
  setShowMap(!showMap);
  // searchNext(new CustomEvent('ionInfinite'));
  fetchData();
  }
};


  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="custom-toolbar">
          <IonTitle className="custom-title">My car application</IonTitle>
          <IonSelect
            className="custom-select"
            slot="end"
            value={filter}
            placeholder="Filter"
            onIonChange={(e) => setFilter(e.detail.value)}
          >
            {filterValues.map((each) => (
              <IonSelectOption key={each} value={each}>
                {each}
              </IonSelectOption>
            ))}
          </IonSelect>
          <IonSearchbar
            className="custom-searchbar"
            placeholder="Search by model"
            value={searchText}
            debounce={200}
            onIonInput={(e) => {
              setSearchText(e.detail.value!);
            }}
            slot="secondary"
          ></IonSearchbar>
          <IonButtons slot="end">
            <IonButton className="custom-logout-button" onClick={handleLogout}>
              Logout
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="custom-content">
        <IonLoading isOpen={isOpen} message="Fetching cars..." />
        {carsAux && (
          <IonList className="custom-car-list">
            {carsAux.map((car) => (
              <MovieComponent
                key={car._id}
                _id={car._id}
                producer={car.producer}
                model={car.model}
                price={car.price}
                sellDate={car.sellDate}
                isElectric={car.isElectric}
                isNotSaved={car.isNotSaved}
                webViewPath={car.webViewPath}
                onEdit={(id) => history.push(`/car/${id}`)}
              />
            ))}
          </IonList>
        )}


        <IonInfiniteScroll
          threshold="100px"
          disabled={!more}
          onIonInfinite={(e: CustomEvent<void>) => searchNext(e)}
        >
          <IonInfiniteScrollContent loadingText="Loading more movies..."></IonInfiniteScrollContent>
        </IonInfiniteScroll>
        {fetchingError && (
          <div className="error-message">
            {fetchingError.message || 'Failed to fetch movies'}
          </div>
        )}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton
            className="custom-fab-button"
            onClick={() => history.push('/movie')}
          >
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
        <IonToast
          isOpen={!!successMessage}
          message={successMessage}
          position="bottom"
          buttons={[
            {
              text: 'Dismiss',
              role: 'cancel',
              handler: () => {
                console.log('Dismiss clicked');
              },
            },
          ]}
          onDidDismiss={closeShowSuccess}
          duration={5000}
        />

      <IonButton onClick={handleMapButtonClick}>
        Show Map
      </IonButton>

      {showMap && (
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Map</IonCardTitle>
          </IonCardHeader>
            <div id="map" style={{ height: '400px', width: '100%', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}></div>
            {markerDetails && (
            <IonCardContent style={{ textAlign: 'center', marginTop: '10px' }}>
              <IonCardTitle style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{markerDetails.title}</IonCardTitle>
              <IonCardTitle style={{ margin: '5px 0' }}>Latitude: {markerDetails.latitude}</IonCardTitle>
              <IonCardTitle style={{ margin: '5px 0' }}>Longitude: {markerDetails.longitude}</IonCardTitle>
            </IonCardContent>
            )}
        </IonCard>
      )}
      </IonContent>

    </IonPage>
  );


    function simpleAnimation() {
    const el = document.querySelector('.custom-fab-button');
    if (el) {
        const animation = createAnimation()
            .addElement(el)
            .duration(5000)
            .direction('alternate')
            .iterations(Infinity)
            .keyframes([
                { offset: 0, transform: 'scale(1.1)', opacity: '0.5', color: 'white'},
                { offset: 0.5, transform: 'scale(1.3)', opacity: '1', color: 'white'},
                { offset: 1, transform: 'scale(1)', opacity: '0.5', color: 'white'}
            ]);
        animation.play();
    }
  }
};

