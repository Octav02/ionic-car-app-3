import React, { useCallback, useContext, useEffect, useState } from 'react';
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
  IonDatetime,
  IonSelect,
  IonSelectOption
} from '@ionic/react';
import { getLogger } from '../core';
import { RouteComponentProps } from 'react-router';
import { CarsContext } from './MovieProvider';
import { Car } from './Movie';
import styles from './styles.module.css';

const log = getLogger('SaveLogger');

interface CarEditProps extends RouteComponentProps<{
  id?: string;
}> {}

export const MovieAdd: React.FC<CarEditProps> = ({ history, match }) => {
  const { cars: cars, updating, updateError, addCar: addCar } = useContext(CarsContext);
  const [model, setModel] = useState('');
  const [price, setPrice] = useState('');
  const [producer, setProducer] = useState('');
  const [sellDate, setSellDate] = useState(new Date());
  const [isElectric, setIsElectric] = useState(true);
  const [carToUpdate, setCarToUpdate] = useState<Car>();

  const handleAdd = useCallback(() => {
    const editedCar ={ ...carToUpdate, model, producer, price: parseFloat(price), sellDate, isElectric };
    log(editedCar);
    console.log(updateError);
    addCar && addCar(editedCar).then(() => editedCar.price && history.goBack());
  }, [carToUpdate, addCar, model, price, sellDate, producer, isElectric, history]);

  const dateChanged = (value: any) => {
    let formattedDate = value;
    console.log(formattedDate);
    setSellDate(formattedDate);
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
            <IonButton onClick={handleAdd}>
              ADD
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonInput label="Model:" className={styles.customInput} placeholder="New Model" value={model} onIonInput={e => setModel(prev => e.detail.value || '')} />
        <IonInput label="Producer:" className={styles.customInput} placeholder="New producer" value={producer} onIonInput={e => setProducer(prev => e.detail.value || '')} />
        <IonInput label="Price:" className={styles.customInput} placeholder="New Price" value={price} onIonInput={e => e.detail.value ? setPrice(prev => e.detail.value!) : setPrice('') }/>
        <IonInput label="Sell Date:" className={styles.customInput} placeholder="Choose sell date" value={new Date(sellDate).toDateString()} />
        <IonDatetime
                onIonChange={(e) => dateChanged(e.detail.value)}>
        </IonDatetime>
        <IonInput label="Is electric?:" className={styles.customInput} placeholder="True/False" value={isElectric==true ? 'True' : 'False'} />
        <IonSelect value={isElectric} onIonChange={e => setIsElectric(e.detail.value)}>
          <IonSelectOption value={true}>
            {'True'}
          </IonSelectOption>
          <IonSelectOption value={false}>
            {'False'}
          </IonSelectOption>
        </IonSelect>
        <IonLoading isOpen={updating} />
        {updateError && (
          <div className={styles.errorMessage}>{updateError.message || 'Failed to save item'}</div>
        )}
      </IonContent>
    </IonPage>
  );
}
