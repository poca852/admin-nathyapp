import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { LngLat, Map, Marker } from 'mapbox-gl';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-map-modal',
  templateUrl: './map-modal.component.html',
  styleUrls: ['./map-modal.component.scss'],
})
export class MapModalComponent  implements AfterViewInit, OnDestroy {

  @Input() lngLat: LngLat;

  @ViewChild('map')
  public divMap: ElementRef;

  public map?: Map;

  public zoom = 14;

  constructor(
    private utilsSvc: UtilsService,
  ) { }

  ngOnDestroy(): void {
    this.map.remove()
  }

  ngAfterViewInit(): void {
    this.map = new Map({
      container: this.divMap.nativeElement, // container ID
      style: 'mapbox://styles/mapbox/streets-v12', // style URL
      center: this.lngLat, // starting position [lng, lat]
      zoom: this.zoom, // starting zoom
   });

   new Marker()
    .setLngLat(this.lngLat)
    .addTo(this.map)

    setTimeout(() => {
      this.map.resize();
    }, 200);
  }

  public dissmissModal() {
    this.utilsSvc.dismissModal();
  }

}
