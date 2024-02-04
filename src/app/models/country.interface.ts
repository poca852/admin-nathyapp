export enum Region {
   Africa   = 'Africa',
   Americas = 'Americas',
   Asia     = 'Asia',
   Europe   = 'Europe',
   Oceania  ='Oceania'
}

export interface Country {
   _id: string;
   id: number;
   id_region: number;
   name: string;
}

export interface State {
   _id: string;
   id: number;
   id_country: number;
   name: string;
}

export interface City {
   _id: string;
   id: number;
   id_state: number;
   name: string;
}
