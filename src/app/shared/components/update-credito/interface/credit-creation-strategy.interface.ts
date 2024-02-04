import { NuevoCredito } from "src/app/models";

export interface CreditCreationStrategy {

   createCredit(formData: NuevoCredito): NuevoCredito;
   
}