import * as moment from 'moment';
import { Credito } from '../models';
export class CrearPago {

   fecha: string = moment().utc(true).format('DD/MM/YYYY hh:mm a');
   valor: number;
   ruta: string;
   credito: string;
   cliente: string;

   constructor( {_id, ruta, cliente}: Credito, valor: number){
      this.credito = _id;
      this.valor = valor;
      this.ruta = ruta;
      this.cliente = cliente._id;
   }

}