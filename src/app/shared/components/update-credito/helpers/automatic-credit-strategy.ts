import { Injectable } from "@angular/core";
import { CreditCreationStrategy } from "../interface/credit-creation-strategy.interface";
import { NuevoCredito } from "src/app/models";

@Injectable()
export class AutomaticCreditStrategy implements CreditCreationStrategy {
   createCredit(formData: NuevoCredito): NuevoCredito {

      let interes = formData.interes || 20;
      
      let total_pagar = (formData.valor_credito * interes) / 100 + formData.valor_credito;

      let valor_cuota = total_pagar / formData.total_cuotas;

      return {
         ...formData,
         interes: formData.interes,
         total_pagar,
         saldo: total_pagar,
         valor_cuota
      }
   }
}