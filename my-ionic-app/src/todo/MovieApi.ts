import axios from "axios";
import { getLogger, authConfig, baseUrl, withLogs } from "../core";
import { Car } from "./Movie";
import { Preferences } from "@capacitor/preferences";

const log = getLogger('movieLogger');

const getBooksUrl = `http://${baseUrl}/api/car`;
const updateBookUrl = `http://${baseUrl}/api/car`;
const createMovieUrl = `http://${baseUrl}/api/car`;

export const getAllMovies: (token: string) => Promise<Car[]> = (token) => {
    return withLogs(axios.get(getBooksUrl, authConfig(token)), 'getAllMovies');
}

export const updateMovieAPI: (token: string, movie: Car) => Promise<Car[]> = (token, movie) => {
    return withLogs(axios.put(`${updateBookUrl}/${movie._id}`, movie, authConfig(token)), 'updateMovie');
}

export const createMovieAPI: (token: string, movie: Car) => Promise<Car[]> = (token, movie) => {
  return withLogs(axios.post(`${createMovieUrl}`, movie, authConfig(token)), 'createMovie');
}

export const deleteMovieAPI: (token: string, id: string) => Promise<Car[]> = (token, id) => {
  return withLogs(axios.delete(`${createMovieUrl}/${id}`, authConfig(token)), 'deleteMovie');
}

interface MessageData {
    event: string;
    payload: {
      successMessage: string,
      updatedMovie: Car
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

  