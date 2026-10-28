import { Component, ElementRef, Input, OnDestroy, ViewChild, inject } from '@angular/core';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'view-image',
  templateUrl: './view-image.component.html',
  styleUrls: ['./view-image.component.scss'],
})
export class ViewImageComponent implements OnDestroy {
  @Input() url = '';
  @Input() titulo = 'Imagen';

  @ViewChild('lienzo') lienzo?: ElementRef<HTMLElement>;
  @ViewChild('foto') foto?: ElementRef<HTMLImageElement>;

  escala = 1;
  rotacion = 0;
  panX = 0;
  panY = 0;
  ajusteRotacion = 1;
  errorCarga = false;
  private reintentos = 0;

  private readonly utilsSvc = inject(UtilsService);
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private lastPinch = 0;
  private lastPanX = 0;
  private lastPanY = 0;
  private origenX = 0;
  private origenY = 0;
  private moved = false;
  private lastTap = 0;
  private readonly onWheelBound = (event: WheelEvent) => this.onWheel(event);
  private readonly onResizeBound = () => this.recalcularAjuste();

  ngAfterViewInit(): void {
    this.lienzo?.nativeElement.addEventListener('wheel', this.onWheelBound, { passive: false });
    window.addEventListener('resize', this.onResizeBound);
  }

  ngOnDestroy(): void {
    this.lienzo?.nativeElement.removeEventListener('wheel', this.onWheelBound);
    window.removeEventListener('resize', this.onResizeBound);
  }

  get transformacion(): string {
    const escala = this.escala * this.ajusteRotacion;
    return `translate(${this.panX}px, ${this.panY}px) rotate(${this.rotacion}deg) scale(${escala})`;
  }

  cerrar(): void {
    this.utilsSvc.dismissModal();
  }

  acercar(): void {
    this.aplicarEscala(this.escala * 1.25);
  }

  alejar(): void {
    this.aplicarEscala(this.escala / 1.25);
  }

  girar(grados: number): void {
    this.rotacion = (this.rotacion + grados + 360) % 360;
    this.recalcularAjuste();
  }

  restablecer(): void {
    this.escala = 1;
    this.rotacion = 0;
    this.panX = 0;
    this.panY = 0;
    this.ajusteRotacion = 1;
  }

  alternarZoom(): void {
    if (this.escala > 1) {
      this.escala = 1;
      this.panX = 0;
      this.panY = 0;
      return;
    }
    this.aplicarEscala(2.5);
  }

  alCargar(): void {
    this.errorCarga = false;
    this.recalcularAjuste();
  }

  alFallar(): void {
    this.errorCarga = true;
  }

  reintentar(): void {
    if (!this.url) return;
    this.errorCarga = false;
    this.reintentos += 1;
  }

  get direccion(): string {
    if (!this.url || this.reintentos === 0 || this.url.startsWith('data:')) return this.url;
    const separador = this.url.includes('?') ? '&' : '?';
    return `${this.url}${separador}reintento=${this.reintentos}`;
  }

  onPointerDown(event: PointerEvent): void {
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size === 1) {
      this.moved = false;
      this.origenX = event.clientX;
      this.origenY = event.clientY;
      this.lastPanX = event.clientX;
      this.lastPanY = event.clientY;
      return;
    }
    this.moved = true;
    this.lastPinch = this.distancia();
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.pointers.has(event.pointerId)) return;
    if (Math.hypot(event.clientX - this.origenX, event.clientY - this.origenY) > 8) {
      this.moved = true;
    }
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.pointers.size >= 2) {
      const dist = this.distancia();
      if (this.lastPinch > 0) {
        this.aplicarEscala(this.escala * (dist / this.lastPinch));
      }
      this.lastPinch = dist;
      return;
    }

    if (this.escala > 1) {
      this.panX += event.clientX - this.lastPanX;
      this.panY += event.clientY - this.lastPanY;
    }
    this.lastPanX = event.clientX;
    this.lastPanY = event.clientY;
  }

  onPointerUp(event: PointerEvent): void {
    this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) this.lastPinch = 0;
    if (this.pointers.size > 0 || this.moved) return;

    const ahora = Date.now();
    if (ahora - this.lastTap < 280) {
      this.alternarZoom();
      this.lastTap = 0;
      return;
    }
    this.lastTap = ahora;
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    this.aplicarEscala(this.escala * factor);
  }

  private aplicarEscala(valor: number): void {
    const siguiente = Math.min(4, Math.max(1, valor));
    if (siguiente === 1) {
      this.panX = 0;
      this.panY = 0;
    }
    this.escala = siguiente;
  }

  private distancia(): number {
    const puntos = [...this.pointers.values()];
    if (puntos.length < 2) return 0;
    return Math.hypot(puntos[0].x - puntos[1].x, puntos[0].y - puntos[1].y);
  }

  private recalcularAjuste(): void {
    const img = this.foto?.nativeElement;
    const caja = this.lienzo?.nativeElement;
    if (!img || !caja || this.rotacion % 180 === 0 || !img.clientWidth || !img.clientHeight) {
      this.ajusteRotacion = 1;
      return;
    }
    const cabe = Math.min(caja.clientWidth / img.clientHeight, caja.clientHeight / img.clientWidth);
    this.ajusteRotacion = Number.isFinite(cabe) ? Math.min(1, cabe * 0.96) : 1;
  }
}
