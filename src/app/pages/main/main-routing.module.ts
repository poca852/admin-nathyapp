import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainPage } from './main.page';

const routes: Routes = [
  {
    path: '',
    component: MainPage,
    children: [
      {
        path: 'home',
        loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
      },
      {
        path: 'pagos',
        loadChildren: () => import('./pagos/pagos.module').then( m => m.PagosPageModule)
      },
      {
        path: 'empleados',
        loadChildren: () => import('./empleados/empleados.module').then( m => m.EmpleadosPageModule)
      },
      {
        path: 'clientes',
        loadChildren: () => import('./clientes/clientes.module').then( m => m.ClientesPageModule)
      },
      {
        path: 'credito',
        loadChildren: () => import('./creditos/creditos.module').then( m => m.CreditosPageModule)
      },
      {
        path: 'detail-cliente',
        loadChildren: () => import('./detail-cliente/detail-cliente.module').then( m => m.DetailClientePageModule)
      },
      {
        path: 'renovaciones',
        loadChildren: () => import('./renovaciones/renovaciones.module').then( m => m.RenovacionesPageModule)
      },
      {
        path: 'rutas',
        loadChildren: () => import('./rutas/rutas.module').then(m => m.RutasPageModule)
      },
      {
        path: 'oficina',
        loadChildren: () => import('./oficina/oficina.module').then( m => m.OficinaPageModule)
      },
      {
        path: 'empresa',
        loadChildren: () => import('./empresa/empresa.module').then( m => m.EmpresaPageModule)
      },
      {
        path: 'caja',
        loadChildren: () => import('./caja/caja.module').then( m => m.CajaPageModule)
      },
    ]
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MainPageRoutingModule {}
