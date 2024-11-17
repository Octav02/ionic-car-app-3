import axios from "axios";
import { getLogger, authConfig, baseUrl, withLogs } from "../core";
import { Car } from "./Movie";
import { Preferences } from "@capacitor/preferences";

const log = getLogger('carAPI');

const getCarsUrl = `http://${baseUrl}/api/car`;
const updateCarsUrl = `http://${baseUrl}/api/car`;
const createCarUrl = `http://${baseUrl}/api/car`;

export const getAllCars: (token: string) => Promise<Car[]> = (token) => {
    return withLogs(axios.get(getCarsUrl, authConfig(token)), 'getAllCars');
}

export const updateCarAPI: (token: string, car: Car) => Promise<Car[]> = (token, car) => {
    return withLogs(axios.put(`${updateCarsUrl}/${car._id}`, car, authConfig(token)), 'updateCar');
}

export const createCarAPI: (token: string, car: Car) => Promise<Car[]> = (token, car) => {
  return withLogs(axios.post(`${createCarUrl}`, car, authConfig(token)), 'createCar');
}

export const deleteCarAPI: (token: string, id: string) => Promise<Car[]> = (token, id) => {
  return withLogs(axios.delete(`${createCarUrl}/${id}`, authConfig(token)), 'deleteCar');
}

interface MessageData {
    event: string;
    payload: {
      successMessage: string,
      updatedCar: Car
    };
}

export const newWebSocket = (token: string, onMessage: (data: MessageData) => void) => {
    const ws = new WebSocket(`ws://${baseUrl}`)
    ws.onopen = () => {
      log('web socket onopen');
      ws.send(JSON.stringify({type: 'authorization', payload :{token}}));
    };
    ws.onclose = () => {
      log('web socket onclose');
    };
    ws.onerror = error => {
      log('web socket onerror', error);
    };
    ws.onmessage = messageEvent => {
      log('web socket onmessage');
      console.log(messageEvent.data);
      onMessage(JSON.parse(messageEvent.data));
    };
    return () => {
      ws.close();
    }
}

  