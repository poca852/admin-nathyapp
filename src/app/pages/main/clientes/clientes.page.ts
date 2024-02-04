import { Component, OnInit, inject } from '@angular/core';
import { UtilsService } from '../../../services/utils.service';
import { ClienteService } from '../../../services/cliente.service';
import { RutaService } from '../../../services/ruta.service';
import { Cliente, Ruta } from 'src/app/models';
import { EmpresaService } from '../../../services/empresa.service';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.page.html',
  styleUrls: ['./clientes.page.scss'],
})
export class ClientesPage implements OnInit {

  private utilsSvc = inject(UtilsService);
  private clienteSvc = inject(ClienteService);

  public loading: boolean = false;
  public currentRuta?: Ruta;

  public clientesFiltrados: Cliente[] = [];
  public clientes: Cliente[] = []

  constructor() { 
   
  }

  ngOnInit() {
  }

  ionViewWillLeave() {
  }

  ionViewWillEnter() {
  }
  
  onChangeRuta(ruta: Ruta){
    this.loading = true;
    this.currentRuta = ruta;
    this.clienteSvc.getClientesByRuta(this.currentRuta._id).subscribe({
      next: clientes => {
        this.clientesFiltrados = clientes
        this.clientes = clientes
        this.loading = false;
      },
      error: err => this.loading = false
    })
  }

  onSearchBar(termino: string) {
    if (!termino || termino === '') {
      this.clientesFiltrados = [...this.clientes];
      return;
    }

    const normalizedQuery = termino.toLowerCase();
    this.clientesFiltrados = this.clientes.filter((item) => {
      return item.nombre.toLowerCase().includes(normalizedQuery);
    });
  }

  goToCliente(cliente: Cliente) {
    this.clienteSvc.setCurrentCliente(cliente)
    this.utilsSvc.routerLink('/main/detail-cliente');
  }

}
