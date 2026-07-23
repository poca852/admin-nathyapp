import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { LngLat, Map, Marker } from 'mapbox-gl';
import { UtilsService } from 'src/app/services/utils.service';
import { LngLatInput, normalizeLngLat, toMapboxLngLat } from 'src/app/helpers/geo.helpers';

@Component({
  selector: 'app-map-modal',
  templateUrl: './map-modal.component.html',
  styleUrls: ['./map-modal.component.scss'],
})
export class MapModalComponent implements AfterViewInit, OnDestroy {

  @Input() lngLat: LngLatInput;

  @ViewChild('map')
  public divMap: ElementRef;

  public map?: Map;

  public zoom = 14;

  private resizeObserver?: ResizeObserver;
  private resolvedLngLat: LngLat | null = null;

  constructor(
    private utilsSvc: UtilsService,
  ) { }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.map) {
      this.map.remove();
    }
  }

  async ngAfterViewInit(): Promise<void> {
    const normalized = normalizeLngLat(this.lngLat);
    this.resolvedLngLat = toMapboxLngLat(this.lngLat);

    if (!this.resolvedLngLat || !normalized) {
      await this.utilsSvc.presentAlert({
        header: 'Ubicación inválida',
        message:
          'Las coordenadas del cliente no son válidas (latitud fuera de -90 a 90). ' +
          'Es posible que estén invertidas o corruptas. Pide al cobrador una nueva solicitud de ubicación.',
        buttons: ['Entendido'],
      });
      this.utilsSvc.dismissModal();
      return;
    }

    if (normalized.swapped) {
      await this.utilsSvc.presentToast({
        message: 'Se corrigió el orden de las coordenadas (lat/lng estaban invertidas)',
        duration: 3500,
        color: 'warning',
        icon: 'warning-outline',
      });
    }

    try {
      this.map = new Map({
        container: this.divMap.nativeElement,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: this.resolvedLngLat,
        zoom: this.zoom,
        trackResize: true,
      });

      new Marker()
        .setLngLat(this.resolvedLngLat)
        .addTo(this.map);

      this.resizeObserver = new ResizeObserver(() => {
        if (this.map) {
          this.map.resize();
        }
      });

      if (this.divMap?.nativeElement) {
        this.resizeObserver.observe(this.divMap.nativeElement);
      }
    } catch (err) {
      console.error(err);
      await this.utilsSvc.presentAlert({
        header: 'No se pudo mostrar el mapa',
        message:
          'Ocurrió un error al cargar Mapbox con estas coordenadas. Revisa la ubicación del cliente o solicita una nueva.',
        buttons: ['Entendido'],
      });
      this.utilsSvc.dismissModal();
    }
  }

  public dissmissModal() {
    this.utilsSvc.dismissModal();
  }

  public openGoogleMaps() {
    const point = this.resolvedLngLat || toMapboxLngLat(this.lngLat);
    if (!point) return;

    const url = `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`;
    window.open(url, '_blank');
  }

}
