import React, { memo } from "react";
import { IonItem, IonLabel } from "@ionic/react";
import { getLogger } from "../core";
import { Movie } from "./Movie";
import './MovieComponent.css'; // Import the CSS file

interface MoviePropsExtended extends Movie {
    onEdit: (_id?: string) => void;
}

const MovieComponent: React.FC<MoviePropsExtended> = ({_id, producer, price, model, sellDate, isElectric, isNotSaved,webViewPath, onEdit }) => (
    <IonItem
    className={`movie-item ${isNotSaved ? "unsaved" : ""}`}
    onClick={() => onEdit(_id)}
  >
    <div className="movie-container">
      <img className="movie-image" src={webViewPath} alt="Photo" />
      <div className="movie-details">
        <h2 className="movie-title">{model}</h2>
        <p className="movie-producer">Producer: {producer}</p>
        <p className="movie-price">Price: ${price}</p>
        {sellDate && (
          <p className="movie-sell-date">
            Sold at: {new Date(sellDate).toDateString()}
          </p>
        )}
        {isElectric && <p className="movie-electric">Electric: Yes</p>}
      </div>
    </div>
  </IonItem>
);


export default memo(MovieComponent);
