import React, { memo } from "react";
import { IonItem, IonLabel } from "@ionic/react";
import { getLogger } from "../core";
import { Movie } from "./Movie";
import styles from "./styles.module.css";

interface MoviePropsExtended extends Movie {
    onEdit: (_id?: string) => void;
}

const MovieComponent: React.FC<MoviePropsExtended> = ({_id, producer, price, model, sellDate, isElectric, isNotSaved,webViewPath, onEdit }) => (
    <IonItem color={isNotSaved ? "medium" : undefined} onClick={()=> onEdit(_id)}>
        <div className={styles.movieContainer}>
            <IonLabel className={styles.movieTitle}>
                <h1>{model}</h1>
            </IonLabel>
            <div className={styles.component}>
                <p>Producer: {producer} </p>
                <p>Price: {price}  $</p>
                {sellDate && (
                    <p>Sold at: {new Date(sellDate).toDateString()} </p>
                )}
                {isElectric && <p>Electric: Yes</p>}
                <img src={webViewPath} alt={"No image"} width={'200px'} height={'200px'}/>
            </div>
        </div>
    </IonItem>
);

export default memo(MovieComponent);
