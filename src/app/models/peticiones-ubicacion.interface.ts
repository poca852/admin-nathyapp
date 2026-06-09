export interface PeticionUbicacion {
  id: string;
  old_ubicacion: number[];
  new_ubicacion: number[];
  cobrador: {
    id: string;
    nombre: string;
  };
  cliente: {
    id: string;
    nombre: string;
    alias: string;
  };
  ruta: {
    id: string;
    nombre: string;
  };
  empresa: {
    id: string;
    nombre: string;
  };
  estado: string;
  fecha_solicitud: Date;
  fecha_actualizacion: Date;
}