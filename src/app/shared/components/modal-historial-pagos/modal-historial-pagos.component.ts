import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CajaMovimiento } from 'src/app/models/caja-movimiento.interface';
import { CreditosService } from 'src/app/services/creditos.service';

@Component({
  selector: 'app-modal-historial-pagos',
  templateUrl: './modal-historial-pagos.component.html',
  styleUrls: ['./modal-historial-pagos.component.scss'],
})
export class ModalHistorialPagosComponent implements OnInit {

  private readonly creditosSvc = inject(CreditosService);

  @Input() creditoId!: string;
  @Input() rutaId!: string;

  readonly loading = signal(false);
  readonly pagos = signal<CajaMovimiento[]>([]);

  ngOnInit(): void {
    this.loadPagos();
  }

  private loadPagos(): void {
    this.loading.set(true);
    this.creditosSvc.getHistorialPagos(this.rutaId, this.creditoId).subscribe({
      next: (pagos) => {
        this.pagos.set(pagos);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
