import { Component, inject, OnInit } from '@angular/core';
import { UtilsService } from 'src/app/services/utils.service';
import { PeticionesService } from 'src/app/services/peticiones.service';
import { PeticionUbicacion } from 'src/app/models';
import { LngLat } from 'mapbox-gl';
import { MapModalComponent } from '../map-modal/map-modal.component';

@Component({
  selector: 'app-notificaciones-modal',
  templateUrl: './notificaciones-modal.component.html',
  styleUrls: ['./notificaciones-modal.component.scss']
})
export class NotificacionesModalComponent implements OnInit {
  private utilsSvc = inject(UtilsService);
  private peticionesSvc = inject(PeticionesService);

  peticiones: PeticionUbicacion[] = [];
  peticionSeleccionada: PeticionUbicacion | null = null;
  mostrarMapaViejo = false;
  mostrarMapaNuevo = false;

  ngOnInit(): void {
    this.cargarPeticiones();
  }

  cargarPeticiones(): void {
    this.peticiones = this.peticionesSvc.peticionesPendientes();
  }

  seleccionarPeticion(peticion: PeticionUbicacion): void {
    this.peticionSeleccionada = peticion;
  }

  aprobarPeticion(id: string): void {
    this.peticionesSvc.aprobarPeticion(id).subscribe({
      next: (value) => {
        this.utilsSvc.presentToast({
          message: 'Petición aprobada exitosamente',
          color: 'success',
          duration: 2300
        });
        this.peticionSeleccionada = null;
        this.cargarPeticiones();
      },
      error: (err) => {
        this.utilsSvc.presentToast({
          message: 'Error al aprobar petición',
          color: 'danger',
          duration: 2300
        });
      }
    });
  }

  rechazarPeticion(id: string): void {
    this.peticionesSvc.rechazarPeticion(id).subscribe({
      next: () => {
        this.utilsSvc.presentToast({
          message: 'Petición rechazada',
          color: 'warning'
        });
        this.peticionSeleccionada = null;
      },
      error: (err) => {
        console.error('Error al rechazar petición:', err);
        this.utilsSvc.presentToast({
          message: 'Error al rechazar petición',
          color: 'danger'
        });
      }
    });
  }

  abrirMapaViejo(): void {
    if (!this.peticionSeleccionada) return;
    this.mostrarMapaViejo = true;
    this.utilsSvc.presentModal({
      component: MapModalComponent,
      componentProps: {
        lngLat: new LngLat(
          this.peticionSeleccionada.old_ubicacion[0],
          this.peticionSeleccionada.old_ubicacion[1]
        )
      }
    }).then(() => {
      this.mostrarMapaViejo = false;
    });
  }

  abrirMapaNuevo(): void {
    if (!this.peticionSeleccionada) return;
    this.mostrarMapaNuevo = true;
    this.utilsSvc.presentModal({
      component: MapModalComponent,
      componentProps: {
        lngLat: new LngLat(
          this.peticionSeleccionada.new_ubicacion[0],
          this.peticionSeleccionada.new_ubicacion[1]
        )
      }
    }).then(() => {
      this.mostrarMapaNuevo = false;
    });
  }

  dismissModal(): void {
    this.utilsSvc.dismissModal();
  }
}