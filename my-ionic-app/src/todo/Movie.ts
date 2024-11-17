export interface Movie {
    _id?: string;
    model?: string;
    producer?: string;
    sellDate?: Date;
    price?: number;
    isElectric?:boolean;
    isNotSaved?:boolean;
    webViewPath?: string;
    latitude?: number;
    longitude?: number;
}