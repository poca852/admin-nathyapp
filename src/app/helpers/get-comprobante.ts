import { momentPlugin } from "../config/plugins/moment.plugin";
import { Cliente, Credito, Pago } from "../models";


export class BuildComprobante {

   public static execute(credito: Credito, cliente: Cliente): string {

      if(!credito || !cliente) {
         throw new Error('El credito y el cliente son obligatorios');
      }

      const { nombre } = cliente;
      const { fecha_inicio, saldo, abonos, atraso, valor_credito, valor_cuota, total_cuotas } = credito;
      const currentPago: Pago = credito.pagos[0];

      let cuotasPendientes = saldo / valor_cuota;
      let cuotasPendientesConFixed = cuotasPendientes.toFixed(2);

      return `
      Fecha: ${momentPlugin()} \n
      Cliente: ${nombre} \n
      Abonos: $${abonos} \n
      Saldo: ${saldo} \n
      Cuotas pendientes: ${cuotasPendientesConFixed} / ${total_cuotas} \n
      Informacion ultimo pago:  \n
      Valor: $${currentPago.valor} \n
      Fecha: ${currentPago.fecha}
      `

   }

}