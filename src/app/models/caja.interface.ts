export interface Caja {
   id: string;
   fecha: Date;
   base: number;
   inversion: number;
   retiro: number;
   gasto: number;
   cobro: number;
   prestamo: number;
   total_clientes: number;
   clientes_pendientes: number;
   renovaciones: number;
   caja_final: number;
   pretendido: number;
   moraCobrada?: number;
   moraPorCobrar?: number;
   /** Flag de empresa: si false, la UI no muestra líneas de mora en caja. */
   cobraMora?: boolean;
 }
