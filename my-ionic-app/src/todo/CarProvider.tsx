import React, { useCallback, useEffect, useReducer, useContext } from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../core';
import { getAllCars, updateCarAPI as updateCarAPI, createCarAPI as createCarAPI, newWebSocket, deleteCarAPI } from './CarApi';
import { Car } from './Car';
import { AuthContext } from '../auth';
import { useNetwork } from '../pages/useNetwork';
import {useIonToast} from "@ionic/react";
import { Preferences } from '@capacitor/preferences';

const log = getLogger('CarProvider');

type UpdateCarFn = (car: Car) => Promise<any>;

interface CarsState {
    cars?: Car[];
    fetching: boolean;
    fetchingError?: Error | null;
    updating: boolean,
    updateError?: Error | null,
    updateCar?: UpdateCarFn,
    addCar?: UpdateCarFn,
    successMessage?: string;
    closeShowSuccess?: () => void;
}

interface ActionProps {
    type: string,
    payload?: any,
}

const initialState: CarsState = {
    fetching: false,
    updating: false,
};

const FETCH_CARS_STARTED = 'FETCH_CARS_STARTED';
const FETCH_CARS_SUCCEEDED = 'FETCH_CARS_SUCCEEDED';
const FETCH_CARS_FAILED = 'FETCH_CARS_FAILED';
const UPDATE_CAR_STARTED = 'UPDATE_CAR_STARTED';
const UPDATE_CAR_SUCCESS = 'UPDATE_CAR_SUCCEDED';
const UPDATE_CAR_FAILED = 'UPDATE_CAR_FAILED';
const SHOW_SUCCESS_MESSSAGE = 'SHOW_SUCCESS_MESSAGE';
const HIDE_SUCCESS_MESSSAGE = 'HIDE_SUCCESS_MESSAGE';
const CREATE_CAR_STARTED = 'CREATE_CAR_STARTED';
const CREATE_CAR_SUCCEDED = 'CREATE_CAR_SUCCEDED';
const CREATE_CAR_FAILED = 'CREATE_CAR_FAILED';

const reducer: (state: CarsState, action: ActionProps) => CarsState 
    = (state, { type, payload }) => {
    switch(type){
        case FETCH_CARS_STARTED:
            return { ...state, fetching: true, fetchingError: null };
        case FETCH_CARS_SUCCEEDED:
            return {...state, cars: payload.cars, fetching: false };
        case FETCH_CARS_FAILED:
            return { ...state, fetchingError: payload.error, fetching: false };
        case UPDATE_CAR_STARTED:
            return { ...state, updateError: null, updating: true };
        case UPDATE_CAR_FAILED:
            return { ...state, updateError: payload.error, updating: false };
        case UPDATE_CAR_SUCCESS:
            const cars = [...(state.cars || [])];
            const car = payload.car;
            const index = cars.findIndex(it => it._id === car._id);
            cars[index] = car;
            return { ...state,  cars, updating: false };
        case CREATE_CAR_FAILED:
            console.log(payload.error);
          return { ...state, updateError: payload.error, updating: false };
        case CREATE_CAR_STARTED:
          return { ...state, updateError: null, updating: true };
        case CREATE_CAR_SUCCEDED:
            const beforeCars = [...(state.cars || [])];
            const createdCars = payload.car;
            console.log(createdCars);
            const indexOfAdded = beforeCars.findIndex(it => it._id === createdCars._id || it.model === createdCars.model);
            console.log("index: ", indexOfAdded);
            if (indexOfAdded === -1) {
                beforeCars.splice(0, 0, createdCars);
            } else {
                beforeCars[indexOfAdded] = createdCars;
            }
            console.log(beforeCars);
            console.log(payload);
            return { ...state,  cars: beforeCars, updating: false, updateError: null };
        case SHOW_SUCCESS_MESSSAGE:
            const allCars = [...(state.cars || [])];
            const updatedCar = payload.updatedCar;
            const indexOfCar = allCars.findIndex(it => it._id === updatedCar._id);
            allCars[indexOfCar] = updatedCar;
            console.log(payload);
            return {...state, cars: allCars, successMessage: payload.successMessage }
        case HIDE_SUCCESS_MESSSAGE:
            return {...state, successMessage: payload }
        
        default:
            return state;
    }
};

export const CarsContext = React.createContext(initialState);

interface CarProviderProps {
    children: PropTypes.ReactNodeLike,
}

export const CarProvider: React.FC<CarProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { cars: cars, fetching, fetchingError, updating, updateError, successMessage } = state;
    const { token } = useContext(AuthContext);
    const { networkStatus } = useNetwork();
    const [toast] = useIonToast();

    useEffect(getItemsEffect, [token]);
    useEffect(wsEffect, [token]);
    useEffect(executePendingOperations, [networkStatus.connected, token, toast]);

    const updateCar = useCallback<UpdateCarFn>(updateCarCallback, [token]);
    const addCar = useCallback<UpdateCarFn>(addCarCallback, [token]);

    log('returns');

    function getItemsEffect() {
        let canceled = false;
        fetchItems();
        return () => {
            canceled = true;
        }

        async function fetchItems() {
          if(!token?.trim()){
            return;
          }

            try{
                log('fetchCars started');
                dispatch({ type: FETCH_CARS_STARTED });
                const cars = await getAllCars(token);
                log('fetchItems succeeded');
                if (!canceled) {
                dispatch({ type: FETCH_CARS_SUCCEEDED, payload: { cars: cars } });
                }
            } catch (error) {
                log('fetchItems failed');
                if (!canceled) {
                    dispatch({ type: FETCH_CARS_FAILED, payload: { error } });
                }
            }
        }
    }

    async function updateCarCallback(car: Car) {
        try {
          log('updateCar started');
          dispatch({ type: UPDATE_CAR_STARTED });
          const updatedCar = await updateCarAPI(token, car);
          log('saveCar succeeded');
          dispatch({ type: UPDATE_CAR_SUCCESS, payload: { car: updatedCar } });
        } catch (error: any) {
          log('updateCar failed');
          // save item to storage
          console.log('Updating car locally...');

          car.isNotSaved = true;
          await Preferences.set({
            key: `upd-${car.model}`,
            value: JSON.stringify({token, car: car })
          });
          dispatch({ type: UPDATE_CAR_SUCCESS, payload: { car: car } });
          toast("You are offline... Updating car locally!", 3000);
    
          if(error.toJSON().message === 'Network Error')
            dispatch({ type: UPDATE_CAR_FAILED, payload: { error: new Error(error.response) } });
        }
    }

    async function addCarCallback(car: Car){
        try{
          log('addCar started');
          dispatch({ type: CREATE_CAR_STARTED });
          console.log(token);
          const addedCar = await createCarAPI(token, car);
          console.log(addedCar);
          log('saveCar succeeded');
          dispatch({ type: CREATE_CAR_SUCCEDED, payload: { car: addedCar } });
        }catch(error: any){
          log('addCar failed');
          console.log(error.response);
          // save item to storage
          console.log('Saving car locally...');
          const { keys } = await Preferences.keys();
          const matchingKeys = keys.filter(key => key.startsWith('sav-'));
          const numberOfItems = matchingKeys.length + 1;
          console.log(numberOfItems);

          car._id = numberOfItems.toString(); // ii adaug si id...
          car.isNotSaved = true;
          await Preferences.set({
            key: `sav-${car.model}`,
            value: JSON.stringify({token, car: car })
          });
          dispatch({ type: CREATE_CAR_SUCCEDED, payload: { car: car } });
          toast("You are offline... Saving car locally!", 3000);
    
          if(error.toJSON().message === 'Network Error')
            dispatch({ type: CREATE_CAR_FAILED, payload: { error: new Error(error.response || 'Network error') } });
        }
    }

    function executePendingOperations(){
      async function helperMethod(){
          if(networkStatus.connected && token?.trim()){
              log('executing pending operations')
              const { keys } = await Preferences.keys();
              for(const key of keys) {
                  if(key.startsWith("sav-")){
                      const res = await Preferences.get({key: key});
                      console.log("Result", res);
                      if (typeof res.value === "string") {
                          const value = JSON.parse(res.value);
                          value.car._id=undefined;  // ca sa imi puna serverul id nou!!
                          log('creating item from pending', value);
                          await addCarCallback(value.car);
                          await Preferences.remove({key: key});
                      }
                  }
              }
              for(const key of keys) {
                if(key.startsWith("upd-")){
                    const res = await Preferences.get({key: key});
                    console.log("Result", res);
                    if (typeof res.value === "string") {
                        const value = JSON.parse(res.value);
                        log('updating item from pending', value);
                        await updateCarCallback(value.car);
                        await Preferences.remove({key: key});
                    }
                }
            }
          }
      }
      helperMethod();
  }

    function wsEffect() {
        let canceled = false;
        log('wsEffect - connecting');
        let closeWebSocket: () => void;
        if(token?.trim()){
          closeWebSocket = newWebSocket(token, message => {
            if (canceled) {
              return;
            }
            const { event, payload } = message;
            console.log('Provider message: ', message);

            log(`ws message, item ${event}`);
            if (event === 'updated') {
              console.log(payload);
              dispatch({ type: SHOW_SUCCESS_MESSSAGE, payload: {successMessage: payload.successMessage, updatedCar: payload.updatedCar } });
            }
            else if(event == 'created'){
              console.log(payload);
              dispatch({ type: CREATE_CAR_SUCCEDED, payload: { car: payload.updatedCar } });
            }
          });
        }
        return () => {
          log('wsEffect - disconnecting');
          canceled = true;
          closeWebSocket?.();
        }
    }

    function closeShowSuccess(){
        dispatch({ type: HIDE_SUCCESS_MESSSAGE, payload: null });
    }

    const value = { cars: cars, fetching, fetchingError, updating, updateError, updateCar: updateCar, addCar: addCar, successMessage, closeShowSuccess };

    return (
        <CarsContext.Provider value={value}>
            {children}
        </CarsContext.Provider>
    );
};

