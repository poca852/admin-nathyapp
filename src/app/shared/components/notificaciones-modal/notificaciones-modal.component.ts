import { Component, inject, OnInit } from '@angular/core';
import { UtilsService } from 'src/app/services/utils.service';
import { PeticionesService } from 'src/app/services/peticiones.service';
import { PeticionesImagenService } from 'src/app/services/peticiones-imagen.service';
import { FirebaseService } from 'src/app/services/firebase.service';
import { RoleService } from 'src/app/services/role.service';
import { PeticionImagen, PeticionUbicacion, FotoSolicitada } from 'src/app/models';
import { MapModalComponent } from '../map-modal/map-modal.component';
import { ViewImageComponent } from '../view-image/view-image.component';

@Component({
  selector: 'app-notificaciones-modal',
  templateUrl: './notificaciones-modal.component.html',
  styleUrls: ['./notificaciones-modal.component.scss']
})
export class NotificacionesModalComponent implements OnInit {
  private utilsSvc = inject(UtilsService);
  private peticionesSvc = inject(PeticionesService);
  private peticionesImagenSvc = inject(PeticionesImagenService);
  private firebaseSvc = inject(FirebaseService);
  private roleSvc = inject(RoleService);

  segmento: 'ubicacion' | 'fotos' = 'ubicacion';
  peticiones: PeticionUbicacion[] = [];
  peticionesFoto: PeticionImagen[] = [];
  peticionSeleccionada: PeticionUbicacion | null = null;
  peticionFoto: PeticionImagen | null = null;
  mostrarMapaViejo = false;
  mostrarMapaNuevo = false;
  readonly puedeAprobarFotos = this.roleSvc.isAdminOrSuperAdmin;

  ngOnInit(): void {
    this.peticiones = this.peticionesSvc.peticionesPendientes();
    this.peticionesImagenSvc.getPeticionesPendientes().subscribe({
      next: () => {
        this.peticionesFoto = this.peticionesImagenSvc.peticionesPendientes();
        if (!this.peticiones.length && this.peticionesFoto.length) {
          this.segmento = 'fotos';
        }
      },
    });
  }

  cargarPeticiones(): void {
    this.peticiones = this.peticionesSvc.peticionesPendientes();
    this.peticionesFoto = this.peticionesImagenSvc.peticionesPendientes();
  }

  cambiarSegmento(event: CustomEvent): void {
    this.segmento = event.detail.value;
    this.peticionSeleccionada = null;
    this.peticionFoto = null;
  }

  seleccionarPeticion(peticion: PeticionUbicacion): void {
    this.peticionSeleccionada = peticion;
  }

  seleccionarFoto(peticion: PeticionImagen): void {
    this.peticionFoto = peticion;
  }

  verFoto(titulo: string, url?: string): void {
    if (!url) return;
    this.utilsSvc.presentModal({
      component: ViewImageComponent,
      cssClass: 'image-viewer-modal',
      componentProps: { url, titulo },
    });
  }

  cambiosDe(peticion: PeticionImagen): { titulo: string; foto: FotoSolicitada }[] {
    const items: { titulo: string; foto: FotoSolicitada | null }[] = [
      { titulo: 'Documento', foto: peticion.document_image },
      { titulo: 'Negocio', foto: peticion.business_image },
      { titulo: 'Casa', foto: peticion.house_image },
    ];
    return items.filter((item): item is { titulo: string; foto: FotoSolicitada } => !!item.foto?.nueva);
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
        this.cargarPeticiones();
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
        lngLat: this.peticionSeleccionada.old_ubicacion,
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
        lngLat: this.peticionSeleccionada.new_ubicacion,
      }
    }).then(() => {
      this.mostrarMapaNuevo = false;
    });
  }

  dismissModal(): void {
    this.utilsSvc.dismissModal();
  }

  aprobarFoto(id: string): void {
    this.peticionesImagenSvc.aprobarPeticion(id).subscribe({
      next: () => {
        this.utilsSvc.presentToast({
          message: 'Fotos reemplazadas',
          color: 'success',
          duration: 2300,
        });
        this.peticionFoto = null;
        this.cargarPeticiones();
      },
      error: (err) => {
        this.utilsSvc.presentToast({
          message: err?.error?.message || 'No se pudo aprobar el cambio de fotos',
          color: 'danger',
          duration: 2500,
        });
      },
    });
  }

  rechazarFoto(id: string): void {
    const huerfanas = this.fotosNuevas(this.peticionFoto);
    this.peticionesImagenSvc.rechazarPeticion(id).subscribe({
      next: async () => {
        await this.firebaseSvc.deleteByUrls(huerfanas);
        this.utilsSvc.presentToast({
          message: 'Cambio de fotos rechazado. Se conservan las actuales.',
          color: 'warning',
          duration: 2500,
        });
        this.peticionFoto = null;
        this.cargarPeticiones();
      },
      error: (err) => {
        this.utilsSvc.presentToast({
          message: err?.error?.message || 'No se pudo rechazar el cambio de fotos',
          color: 'danger',
          duration: 2500,
        });
      },
    });
  }

  private fotosNuevas(peticion: PeticionImagen | null): string[] {
    if (!peticion) return [];
    return [
      peticion.document_image?.nueva,
      peticion.business_image?.nueva,
      peticion.house_image?.nueva,
    ].filter((url): url is string => !!url);
  }
}