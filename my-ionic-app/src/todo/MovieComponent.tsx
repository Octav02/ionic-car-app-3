import React, { memo } from "react";
import { IonItem, IonLabel } from "@ionic/react";
import { getLogger } from "../core";
import { Car } from "./Movie";
import './MovieComponent.css'; // Import the CSS file

interface CarPropsExtended extends Car {
    onEdit: (_id?: string) => void;
}

const MovieComponent: React.FC<CarPropsExtended> = ({_id, producer, price, model, sellDate, isElectric, isNotSaved,webViewPath, onEdit }) => (
    <IonItem
    className={`car-item ${isNotSaved ? "unsaved" : ""}`}
    onClick={() => onEdit(_id)}
  >
    <div className="car-container">
      <img className="car-image" src={webViewPath} alt="Photo" />
      <div className="car-details">
        <h2 className="car-title">{model}</h2>
        <p className="car-producer">Producer: {producer}</p>
        <p className="car-price">Price: ${price}</p>
        {sellDate && (
          <p className="car-sell-date">
            Sold at: {new Date(sellDate).toDateString()}
          </p>
        )}
        {isElectric && <p className="car-electric">Electric: Yes</p>}
      </div>
    </div>
  </IonItem>
);


export default memo(MovieComponent);
