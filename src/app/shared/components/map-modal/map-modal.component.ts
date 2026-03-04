import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { LngLat, Map, Marker } from 'mapbox-gl';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-map-modal',
  templateUrl: './map-modal.component.html',
  styleUrls: ['./map-modal.component.scss'],
})
export class MapModalComponent implements AfterViewInit, OnDestroy {

  @Input() lngLat: LngLat;

  @ViewChild('map')
  public divMap: ElementRef;

  public map?: Map;

  public zoom = 14;

  private resizeObserver?: ResizeObserver;

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

  ngAfterViewInit(): void {
    this.map = new Map({
      container: this.divMap.nativeElement, // container ID
      style: 'mapbox://styles/mapbox/satellite-streets-v12', // style URL
      center: this.lngLat, // starting position [lng, lat]
      zoom: this.zoom, // starting zoom
      trackResize: true // Use mapbox's built-in resize tracking just in case
    });

    new Marker()
      .setLngLat(this.lngLat)
      .addTo(this.map)

    // Ensure map properly fits its container when the modal finishes animating/rendering
    this.resizeObserver = new ResizeObserver(() => {
      if (this.map) {
        this.map.resize();
      }
    });

    if (this.divMap && this.divMap.nativeElement) {
      this.resizeObserver.observe(this.divMap.nativeElement);
    }
  }

  public dissmissModal() {
    this.utilsSvc.dismissModal();
  }

  public openGoogleMaps() {
    if (this.lngLat) {
      let lat: number, lng: number;
      if (Array.isArray(this.lngLat)) {
        lng = this.lngLat[0];
        lat = this.lngLat[1];
      } else {
        lng = (this.lngLat as any).lng;
        lat = (this.lngLat as any).lat;
      }
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      window.open(url, '_blank');
    }
  }

}
