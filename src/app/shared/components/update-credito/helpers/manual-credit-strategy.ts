import { Injectable } from "@angular/core";
import { CreditCreationStrategy } from "../interface/credit-creation-strategy.interface";
import { NuevoCredito } from "src/app/models";

@Injectable()
export class ManualCreditStrategy implements CreditCreationStrategy {
   createCredit(formData: NuevoCredito): NuevoCredito {

      const valor_credito = formData.valor_credito;
      const valor_cuota = formData.valor_cuota;
      const total_cuotas = formData.total_cuotas;

      // Calcular el interés basado en los valores proporcionados
      const interes = ((valor_credito - valor_cuota! * total_cuotas) / valor_credito);

      const saldo = valor_cuota! * total_cuotas;
      
      return {
         ...formData,
         interes,
         saldo,
         total_pagar: saldo
      }

   }

}