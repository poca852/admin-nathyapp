import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatetimeCustomEvent, IonModal } from '@ionic/angular';
import { finalize } from 'rxjs/operators';

import { Caja, Ruta } from 'src/app/models';
import { CajaService } from '../../../services/caja.service';
import { UtilsService } from '../../../services/utils.service';
import { EmpresaService } from '../../../services/empresa.service';

@Component({
  selector: 'app-caja',
  templateUrl: './caja.page.html',
  styleUrls: ['./caja.page.scss'],
})
export class CajaPage {
  @ViewChild('modalCaja') modalCaja!: IonModal;

  private readonly cajaSvc = inject(CajaService);
  private readonly utilsSvc = inject(UtilsService);
  private readonly empresaSvc = inject(EmpresaService);
  private readonly router = inject(Router);

  readonly dateSelect = signal<Date>(this.startOfToday());
  readonly ruta = signal<Ruta | null>(null);
  readonly currentCaja = signal<Caja | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly searched = signal(false);
  /** true cuando la última carga usó ledger en vivo */
  readonly isLive = signal(false);

  readonly cobroPct = computed(() => {
    const caja = this.currentCaja();
    if (!caja || !caja.pretendido || caja.pretendido <= 0) return null;
    return Math.round((Number(caja.cobro || 0) / Number(caja.pretendido)) * 100);
  });

  ionViewWillEnter(): void {
    const preselected = this.empresaSvc.ruta();
    if (preselected?.id) {
      this.ruta.set(preselected);
    }
    if (this.ruta()?.id) {
      this.searchCaja();
    }
  }

  ionViewWillLeave(): void {
    this.currentCaja.set(null);
    this.isLive.set(false);
    this.searched.set(false);
    this.loadError.set(false);
    this.loading.set(false);
  }

  onChangeDay(e: DatetimeCustomEvent): void {
    const dateValue = Array.isArray(e.detail.value)
      ? e.detail.value[0]
      : e.detail.value;
    if (!dateValue) return;

    const newDate = new Date(dateValue);
    newDate.setHours(0, 0, 0, 0);
    this.dateSelect.set(newDate);
    this.modalCaja?.dismiss();
    this.searchCaja();
  }

  onChangeRuta(ruta: Ruta): void {
    this.ruta.set(ruta ?? null);
    if (ruta) {
      this.empresaSvc.setRuta(ruta);
    }
    this.searchCaja();
  }

  handleRefresh(event: any): void {
    this.searchCaja(event);
  }

  private startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private isSelectedToday(): boolean {
    const selected = this.dateSelect();
    const today = this.startOfToday();
    return (
      selected.getFullYear() === today.getFullYear() &&
      selected.getMonth() === today.getMonth() &&
      selected.getDate() === today.getDate()
    );
  }

  private shouldUseLive(): boolean {
    const ruta = this.ruta();
    if (!ruta || !this.isSelectedToday()) return false;
    // Día de hoy: preferir ledger vivo (también si la ruta está abierta)
    return true;
  }

  searchCaja(event?: any): void {
    const ruta = this.ruta();
    const date = this.dateSelect();

    if (!ruta?.id) {
      this.utilsSvc.presentToast({
        message: 'Selecciona una ruta',
        duration: 2200,
        color: 'warning',
      });
      event?.target?.complete?.();
      return;
    }
    if (!date || Number.isNaN(date.getTime())) {
      this.utilsSvc.presentToast({
        message: 'Selecciona una fecha',
        duration: 2200,
        color: 'warning',
      });
      event?.target?.complete?.();
      return;
    }

    const useLive = this.shouldUseLive();
    this.loading.set(true);
    this.loadError.set(false);
    this.searched.set(true);

    const request$ = useLive
      ? this.cajaSvc.getCurrentCaja(ruta.id)
      : this.cajaSvc.getCajaByRutaAndDate(ruta.id, date.toISOString());

    request$
      .pipe(
        finalize(() => {
          this.loading.set(false);
          event?.target?.complete?.();
        }),
      )
      .subscribe({
        next: (caja) => {
          this.currentCaja.set(caja);
          this.isLive.set(useLive && caja.status !== false);
          this.loadError.set(false);
        },
        error: (err) => {
          this.currentCaja.set(null);
          this.isLive.set(false);
          this.loadError.set(true);
          const message =
            err?.error?.message ||
            (useLive
              ? 'No hay caja abierta para hoy en esta ruta'
              : 'No se encontraron registros de este día');
          this.utilsSvc.presentToast({
            message,
            duration: 2800,
            color: 'warning',
          });
        },
      });
  }

  async goTo(path: '/main/pagos' | '/main/oficina'): Promise<void> {
    const ruta = this.ruta();
    if (ruta) {
      this.empresaSvc.setRuta(ruta);
    }
    const fecha = this.dateSelect();
    await this.router.navigate([path], {
      queryParams: {
        fecha: fecha ? fecha.toISOString() : undefined,
      },
    });
  }
}
