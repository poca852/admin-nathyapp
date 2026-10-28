export interface FotoSolicitada {
  anterior: string;
  nueva: string;
}

export interface PeticionImagen {
  id: string;
  estado: string;
  fecha_solicitud: string;
  fecha_actualizacion: string;
  document_image: FotoSolicitada | null;
  business_image: FotoSolicitada | null;
  house_image: FotoSolicitada | null;
  cobrador: { id: string; nombre: string };
  cliente: { id: string; nombre: string; alias: string };
  ruta: { id: string; nombre: string };
  empresa: { id: string; nombre: string };
}
