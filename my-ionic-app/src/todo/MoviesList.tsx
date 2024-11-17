import React, { useContext, useEffect, useState } from 'react';
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
         IonSelect, IonSelectOption, createAnimation } from '@ionic/react';

import { add } from 'ionicons/icons';
import { AuthContext } from '../auth';
import { NetworkState } from '../pages/NetworkState';
import { Movie } from './Movie';
import './MovieList.css'; // Import the CSS file

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const log = getLogger('MoviesList');
const moviesPerPage = 5;
const filterValues = ["IsElectric", "IsNotElectric"];

export const MoviesList: React.FC<RouteComponentProps> = ({ history }) => {
  const { movies, fetching, fetchingError, successMessage, closeShowSuccess } = useContext(MoviesContext);
  const { logout } = useContext(AuthContext);
  const [isOpen, setIsOpen]= useState(false);
  const [index, setIndex] = useState<number>(0);
  const [moviesAux, setMoviesAux] = useState<Movie[] | undefined>([]);
  const [more, setHasMore] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState<string | undefined>(undefined);
  //const [hasFetched, setHasFetched] = useState(false);

  //animations
  useEffect(simpleAnimation, []);

  useEffect(()=>{
    if(fetching) setIsOpen(true);
    else setIsOpen(false);
  }, [fetching]);

  log('render');
  console.log(movies);

  function handleLogout(){
    logout?.();
    history.push('/login');
  }

  //pagination
  useEffect(()=>{
    fetchData();
  }, [movies]);

  // searching
  useEffect(()=>{
    if (searchText === "") {
      setMoviesAux(movies);
    }
    if (movies && searchText !== "") {
      setMoviesAux(movies.filter(movie => movie.model!.startsWith(searchText)));
    }
  }, [searchText]);

   // filtering
   useEffect(() => {
    if (movies && filter) {
        setMoviesAux(movies.filter(movie => {
            if (filter === "IsPartOfASerie")
                return movie.isElectric === true;
            else
                return movie.isElectric === false;
        }));
    }
}, [filter]);

  function fetchData() {
    if(movies){
      const newIndex = Math.min(index + moviesPerPage, movies.length);
      if( newIndex >= movies.length){
          setHasMore(false);
      }
      else{
          setHasMore(true);
      }
      setMoviesAux(movies.slice(0, newIndex));
      setIndex(newIndex);
    }
  }

  async function searchNext($event: CustomEvent<void>){
    await fetchData();
    await ($event.target as HTMLIonInfiniteScrollElement).complete();
  }
  const icon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41]
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="custom-toolbar">
          <IonTitle className="custom-title">MOVIE APP</IonTitle>
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
        <IonLoading isOpen={isOpen} message="Fetching movies..." />
        {moviesAux && (
          <IonList className="custom-movie-list">
            {moviesAux.map((movie) => (
              <MovieComponent
                key={movie._id}
                _id={movie._id}
                producer={movie.producer}
                model={movie.model}
                price={movie.price}
                sellDate={movie.sellDate}
                isElectric={movie.isElectric}
                isNotSaved={movie.isNotSaved}
                webViewPath={movie.webViewPath}
                onEdit={(id) => history.push(`/movie/${id}`)}
              />
            ))}
          </IonList>
        )}

<MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {moviesAux && moviesAux.map((movie) => (
        <Marker
          key={movie._id}
          position={[movie.latitude || 42, movie.longitude || 42]}
          icon={icon}
        >
          <Popup>
            <div>
              <h3>{movie.producer}</h3>
              <p>{movie.model}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>

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

