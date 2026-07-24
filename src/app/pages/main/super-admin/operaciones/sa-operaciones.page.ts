import { Component, inject, signal, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { firstValueFrom, Subscription, filter } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { Caja, Cliente, Credito, Empresa, Ruta } from 'src/app/models';
import { MovimientoCaja } from 'src/app/models/movimiento-caja.interface';
import { SubTipo } from 'src/app/models/sub-tipo.enum';
import { CajaService } from 'src/app/services/caja.service';
import { ClienteService } from 'src/app/services/cliente.service';
import { CreditosService } from 'src/app/services/creditos.service';
import { EmpresaService } from 'src/app/services/empresa.service';
import { OficinaService } from 'src/app/services/oficina.service';
import { PagosService } from 'src/app/services/pagos.service';
import { SuperAdminContextService } from 'src/app/services/super-admin-context.service';
import { UtilsService } from 'src/app/services/utils.service';
import { MovimientoResumen } from 'src/app/pages/main/oficina/interfaces/resumen-oficina.interface';

export interface SaMovimientoOficina {
  id: string;
  subTipo: SubTipo;
  concepto?: string;
  valor: number;
  fecha: Date | string;
  comentario?: string;
  categoriaGasto?: string;
}

type OpsTab = 'creditos' | 'clientes' | 'pagos' | 'cajas' | 'oficina';

@Component({
  selector: 'app-sa-operaciones',
  templateUrl: './sa-operaciones.page.html',
  styleUrls: ['./sa-operaciones.page.scss'],
})
export class SaOperacionesPage implements OnDestroy {
  private readonly empresaSvc = inject(EmpresaService);
  private readonly clienteSvc = inject(ClienteService);
  private readonly creditoSvc = inject(CreditosService);
  private readonly pagosSvc = inject(PagosService);
  private readonly cajaSvc = inject(CajaService);
  private readonly oficinaSvc = inject(OficinaService);
  private readonly utilsSvc = inject(UtilsService);
  private readonly router = inject(Router);
  readonly ctx = inject(SuperAdminContextService);
  private navSub?: Subscription;

  readonly SubTipo = SubTipo;
  readonly tab = signal<OpsTab>('creditos');
  readonly loading = signal(false);
  readonly rutas = signal<Ruta[]>([]);
  readonly selectedEmpresaId = signal<string | null>(null);
  readonly selectedRutaId = signal<string | null>(null);
  readonly selectedDate = signal(new Date().toISOString());

  readonly creditos = signal<Credito[]>([]);
  readonly clientes = signal<Cliente[]>([]);
  readonly pagos = signal<MovimientoCaja[]>([]);
  readonly caja = signal<Caja | null>(null);
  readonly oficinaMovimientos = signal<SaMovimientoOficina[]>([]);

  ngOnInit(): void {
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        if (/\/super-admin\/operaciones\/?$/.test((e.urlAfterRedirects || e.url).split('?')[0])) {
          this.onEnter();
        }
      });
    this.onEnter();
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  ionViewWillEnter(): void {
    this.onEnter();
  }

  private onEnter(): void {
    if (this.ctx.empresas().length === 0) {
      this.ctx.loadEmpresas().subscribe();
    }
    if (this.selectedRutaId()) {
      this.reloadData();
    }
  }

  setTab(value: OpsTab): void {
    this.tab.set(value);
    this.reloadData();
  }

  async onEmpresaChange(ev: CustomEvent): Promise<void> {
    const id = String(ev.detail?.value || '') || null;
    this.selectedEmpresaId.set(id);
    this.selectedRutaId.set(null);
    this.clearLists();
    if (!id) {
      this.rutas.set([]);
      return;
    }
    try {
      const detail = await firstValueFrom(this.empresaSvc.getEmpresa(id));
      this.rutas.set(detail.rutas || []);
      this.ctx.selectEmpresa({ ...detail, id: detail.id || (detail as any)._id });
    } catch {
      this.rutas.set([]);
    }
  }

  onRutaChange(ev: CustomEvent): void {
    const id = String(ev.detail?.value || '') || null;
    this.selectedRutaId.set(id);
    const ruta = this.rutas().find((r) => (r.id || (r as any)._id) === id) || null;
    this.ctx.selectRuta(ruta);
    this.reloadData();
  }

  onDateChange(ev: CustomEvent): void {
    const value = Array.isArray(ev.detail?.value) ? ev.detail.value[0] : ev.detail?.value;
    if (value) this.selectedDate.set(String(value));
    this.reloadData();
  }

  private clearLists(): void {
    this.creditos.set([]);
    this.clientes.set([]);
    this.pagos.set([]);
    this.caja.set(null);
    this.oficinaMovimientos.set([]);
  }

  reloadData(): void {
    const rutaId = this.selectedRutaId();
    if (!rutaId) {
      this.clearLists();
      return;
    }

    const tab = this.tab();
    this.loading.set(true);

    if (tab === 'creditos') {
      this.creditoSvc.getCreditosByRuta(rutaId).pipe(
        finalize(() => this.loading.set(false)),
      ).subscribe({
        next: (list) => this.creditos.set(list || []),
        error: () => {
          this.creditos.set([]);
          this.toastError('No se pudieron cargar créditos');
        },
      });
      return;
    }

    if (tab === 'clientes') {
      this.clienteSvc.getClientesByRuta(rutaId).pipe(
        finalize(() => this.loading.set(false)),
      ).subscribe({
        next: (list) => this.clientes.set(list || []),
        error: () => {
          this.clientes.set([]);
          this.toastError('No se pudieron cargar clientes');
        },
      });
      return;
    }

    if (tab === 'pagos') {
      this.pagosSvc.getPagosByRutaAndDate(rutaId, new Date(this.selectedDate())).pipe(
        finalize(() => this.loading.set(false)),
      ).subscribe({
        next: (list) => this.pagos.set(list || []),
        error: () => {
          this.pagos.set([]);
          this.toastError('No se pudieron cargar pagos');
        },
      });
      return;
    }

    if (tab === 'oficina') {
      const fecha = this.selectedDate().slice(0, 10);
      this.oficinaSvc.getResumen(rutaId, fecha).pipe(
        finalize(() => this.loading.set(false)),
      ).subscribe({
        next: (res) => {
          const movimientos: SaMovimientoOficina[] = [
            ...this.mapOficinaMovimientos(res.gastos?.movimientos || [], SubTipo.GASTO),
            ...this.mapOficinaMovimientos(res.inversiones?.movimientos || [], SubTipo.INVERSION),
            ...this.mapOficinaMovimientos(res.retiros?.movimientos || [], SubTipo.RETIRO),
          ];
          movimientos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
          this.oficinaMovimientos.set(movimientos);
        },
        error: () => {
          this.oficinaMovimientos.set([]);
          this.toastError('No se pudieron cargar movimientos de oficina');
        },
      });
      return;
    }

    this.cajaSvc.getCajaByRutaAndDate(rutaId, this.selectedDate()).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (caja) => this.caja.set(caja || null),
      error: () => {
        this.caja.set(null);
        this.toastError('No se pudo cargar la caja');
      },
    });
  }

  private mapOficinaMovimientos(movs: MovimientoResumen[], subTipo: SubTipo): SaMovimientoOficina[] {
    return movs.map((m) => ({
      id: m.id,
      subTipo,
      concepto: m.concepto,
      valor: m.monto,
      fecha: m.fecha,
      comentario: m.comentario,
      categoriaGasto: m.categoriaGasto,
    }));
  }

  getSubTipoLabel(subTipo: SubTipo): string {
    const labels: Record<string, string> = {
      [SubTipo.GASTO]: 'Gasto',
      [SubTipo.INVERSION]: 'Inversión',
      [SubTipo.RETIRO]: 'Retiro',
    };
    return labels[subTipo] ?? subTipo;
  }

  private toastError(message: string): void {
    this.utilsSvc.presentToast({ message, color: 'danger', duration: 3000 });
  }

  empresaId(e: Empresa): string {
    return e.id || (e as any)._id;
  }

  rutaId(r: Ruta): string {
    return r.id || (r as any)._id;
  }

  openCredito(credito: Credito): void {
    const id = credito.id || credito._id;
    this.ctx.setDetailPayload({ data: credito, rutaId: this.selectedRutaId() });
    this.utilsSvc.routerLink('/main/super-admin/operaciones/credito/:id', { id });
  }

  openCliente(cliente: Cliente): void {
    const id = cliente.id || (cliente as any)._id;
    this.ctx.setDetailPayload({ data: cliente });
    this.utilsSvc.routerLink('/main/super-admin/operaciones/cliente/:id', { id });
  }

  openPago(pago: MovimientoCaja): void {
    const id = pago.id || (pago as any)._id;
    this.ctx.setDetailPayload({ data: pago });
    this.utilsSvc.routerLink('/main/super-admin/operaciones/pago/:id', { id });
  }

  openCaja(): void {
    const current = this.caja();
    if (!current) return;
    const id = current.id || (current as any)._id || 'caja';
    this.ctx.setDetailPayload({ data: current });
    this.utilsSvc.routerLink('/main/super-admin/operaciones/caja/:id', { id });
  }

  openOficina(movimiento: SaMovimientoOficina): void {
    const ruta = this.rutas().find((r) => this.rutaId(r) === this.selectedRutaId()) || null;
    this.ctx.setDetailPayload({
      data: movimiento,
      ruta,
      fecha: this.selectedDate().slice(0, 10),
    });
    this.utilsSvc.routerLink('/main/super-admin/operaciones/oficina/:id', { id: movimiento.id });
  }
}
