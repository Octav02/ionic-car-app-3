import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonLoading,
  IonPage,
  IonTitle,
  IonToolbar,
  IonBackButton,
  IonLabel,
  IonFab,
  IonFabButton,
  IonIcon,
  IonActionSheet,
  createAnimation,
  IonModal
} from '@ionic/react';
import { getLogger } from '../core';
import { RouteComponentProps } from 'react-router';
import { CarsContext } from './CarProvider';
import { Car } from './Car';
import { MyPhoto, usePhotos } from '../photo/usePhotos';
import { camera, close, trash } from 'ionicons/icons';
import MyMap from '../maps/MyMap';
import { useMyLocation } from '../maps/useMyLocation';
import styles from './styles.module.css';

const log = getLogger('EditLogger');

interface CarEditProps extends RouteComponentProps<{
  id?: string;
}> {}

export const CarEdit: React.FC<CarEditProps> = ({ history, match }) => {
  const { cars: cars, updating, updateError, updateCar: updateCar} = useContext(CarsContext);
  const [model, setModel] = useState('');
  const [price, setPrice] = useState('');
  const [carToUpdate, setCarToUpdate] = useState<Car>();

  //for photo
  const [webViewPath, setWebViewPath] = useState<string | undefined>('');
  const { photos, takePhoto, deletePhoto } = usePhotos();
  const [photoToDelete, setPhotoToDelete] = useState<MyPhoto>();

  const filteredPhoto = photos.find(p => p.webviewPath === webViewPath);
  console.log('filtered photo: ', filteredPhoto);

  //for map
  const [currentLatitude, setCurrentLatitude] = useState<number | undefined>(undefined);
  const [currentLongitude, setCurrentLongitude] = useState<number | undefined>(undefined);
  console.log('render', webViewPath, currentLatitude, currentLongitude);

  useEffect(() => {
    const routeId = match.params.id || '';
    console.log(routeId);
    const car = cars?.find(it => it._id === routeId);
    setCarToUpdate(car);
    if(car){
      setModel(car.model || '');
      setPrice(car.price?.toString() || '');

      //for photo
      setWebViewPath(car.webViewPath || '');
      
      //for map
      setCurrentLatitude(car.latitude ? car.latitude : 46);
      setCurrentLongitude(car.longitude ? car.longitude : 23);
    }
  }, [match.params.id, cars]);

  const handleUpdate = useCallback(() => {
    const editedCar ={ ...carToUpdate, model: model, price: parseFloat(price),webViewPath: webViewPath, latitude: currentLatitude, longitude: currentLongitude };
    log(editedCar);
    console.log(updateCar);
    console.log(editedCar);
    updateCar && updateCar(editedCar).then(() => editedCar.price && history.push('/cars'));
  }, [carToUpdate, updateCar, model, price,webViewPath,currentLatitude,currentLongitude, history]);

  async function handlePhotoChange() {
    console.log('handle photo change...');
    const imagePath = await takePhoto();
    console.log(imagePath);

    if(imagePath){
      setWebViewPath(imagePath);
      console.log('here', imagePath);
    }
    console.log(webViewPath);
  }


  const modalEl = useRef<HTMLIonModalElement>(null);
  const closeModal = () => {
    modalEl.current?.dismiss();
  };

  const enterAnimation = (baseEl: HTMLElement) => {
    const root = baseEl.shadowRoot!;

    const backdropAnimation = createAnimation()
      .addElement(root.querySelector('ion-backdrop')!)
      .fromTo('opacity', '0.01', 'var(--backdrop-opacity)');

    const wrapperAnimation = createAnimation()
      .addElement(root.querySelector('.modal-wrapper')!)
      .duration(1000)
      .keyframes([
        { offset: 0, opacity: '0', transform: 'scale(0)' },
        { offset: 0.4, opacity: '0.7', transform: 'scale(1.3)' },
        { offset: 1, opacity: '0.99', transform: 'scale(1)' },
      ]);

    return createAnimation()
      .addElement(baseEl)
      .easing('ease-out')
      .duration(500)
      .addAnimation([backdropAnimation, wrapperAnimation]);
  };

  const leaveAnimation = (baseEl: HTMLElement) => {
    return enterAnimation(baseEl).direction('reverse');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
        <IonButtons slot="start">
            <IonBackButton></IonBackButton>
          </IonButtons>
          <IonTitle>EDIT</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleUpdate}>
              UPDATE
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonInput label="Model:" className={styles.customInput} placeholder="New Model" value={model} onIonInput={e => setModel(prev => e.detail.value || '')} />
        <IonInput label="Price:" className={styles.customInput} placeholder="New Price" value={price} onIonInput={e => e.detail.value ? setPrice(prev => e.detail.value!) : setPrice('') }/>
        <IonLoading isOpen={updating} />
        {updateError && (
          <div className={styles.errorMessage}>{updateError.message || 'Failed to update item'}</div>
        )}
        {webViewPath && (<img onClick={()=> setPhotoToDelete(filteredPhoto)} src={webViewPath} width={'200px'} height={'200px'}/>)}
        <br />
        {!webViewPath && (
          <IonFab vertical="bottom" horizontal="center" slot="fixed">
              <IonFabButton onClick={handlePhotoChange}>
                  <IonIcon icon={camera}/>
              </IonFabButton>
          </IonFab>)
        }
          <IonActionSheet
            isOpen={!!photoToDelete}
            buttons={[{
              text: 'Delete',
              role: 'destructive',
              icon: trash,
              handler: () => {
                if (photoToDelete) {
                  deletePhoto(photoToDelete);
                  setPhotoToDelete(undefined);
                  setWebViewPath(undefined);
                }
              }
            }, {
              text: 'Cancel',
              icon: close,
              role: 'cancel'
            }]}
            onDidDismiss={() => setPhotoToDelete(undefined)} />
            <IonButton id="modal-trigger">Present Modal</IonButton>
            <IonModal trigger="modal-trigger" ref={modalEl} enterAnimation={enterAnimation} leaveAnimation={leaveAnimation}>
              <IonHeader>
                <IonToolbar>
                  <IonTitle>Modal</IonTitle>
                  <IonButtons slot="end">
                    <IonButton onClick={closeModal}>Close</IonButton>
                  </IonButtons>
                </IonToolbar>
              </IonHeader>
            <IonContent className="ion-padding">
              <MyMap
                  lat={currentLatitude}
                  lng={currentLongitude}
                  onCoordsChanged={(newLat, newLng)=>{
                    log(`HAHA ${newLat} ${newLng}`)
                    setCurrentLatitude(newLat);
                    setCurrentLongitude(newLng);
                  }}                      
              />    
            </IonContent>
            </IonModal>
      </IonContent>
    </IonPage>
  );
}
