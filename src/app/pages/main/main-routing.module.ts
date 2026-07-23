import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainPage } from './main.page';
import { tenantAdminGuard } from 'src/app/guards/tenant-admin.guard';
import { roleGuard } from 'src/app/guards/role.guard';
import { Roles } from 'src/app/models/roles.enum';

const routes: Routes = [
  {
    path: '',
    component: MainPage,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        canActivate: [tenantAdminGuard],
        loadChildren: () => import('./home/home.module').then(m => m.HomePageModule)
      },
      {
        path: 'pagos',
        canActivate: [tenantAdminGuard],
        loadChildren: () => import('./pagos/pagos.module').then(m => m.PagosPageModule)
      },
      {
        path: 'empleados',
        canActivate: [tenantAdminGuard],
        loadChildren: () => import('./empleados/empleados.module').then(m => m.EmpleadosPageModule)
      },
      {
        path: 'seguimiento',
        canActivate: [tenantAdminGuard],
        loadChildren: () => import('./seguimiento/seguimiento.module').then(m => m.SeguimientoPageModule)
      },
      {
        path: 'clientes',
        canActivate: [tenantAdminGuard],
        loadChildren: () => import('./clientes/clientes.module').then(m => m.ClientesPageModule)
      },
      {
        path: 'credito',
        canActivate: [tenantAdminGuard],
        loadChildren: () => import('./creditos/creditos.module').then(m => m.CreditosPageModule)
      },
      {
        path: 'detail-cliente/:idCliente',
        canActivate: [tenantAdminGuard],
        loadChildren: () => import('./detail-cliente/detail-cliente.module').then(m => m.DetailClientePageModule)
      },
      {
        path: 'renovaciones',
        canActivate: [tenantAdminGuard],
        loadChildren: () => import('./renovaciones/renovaciones.module').then(m => m.RenovacionesPageModule)
      },
      {
        path: 'rutas',
        canActivate: [tenantAdminGuard],
        loadChildren: () => import('./rutas/rutas.module').then(m => m.RutasPageModule)
      },
      {
        path: 'oficina',
        canActivate: [tenantAdminGuard],
        loadChildren: () => import('./oficina/oficina.module').then(m => m.OficinaPageModule)
      },
      {
        path: 'empresa',
        canActivate: [tenantAdminGuard],
        loadChildren: () => import('./empresa/empresa.module').then(m => m.EmpresaPageModule)
      },
      {
        path: 'caja',
        canActivate: [tenantAdminGuard],
        loadChildren: () => import('./caja/caja.module').then(m => m.CajaPageModule)
      },
      {
        path: 'reportes',
        canActivate: [tenantAdminGuard],
        loadChildren: () => import('./reportes/reportes.module').then(m => m.ReportesPageModule)
      },
      {
        path: 'super-admin',
        canActivate: [roleGuard],
        data: { roles: [Roles.superAdmin] },
        loadChildren: () => import('./super-admin/super-admin.module').then(m => m.SuperAdminPageModule)
      },
    ]
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MainPageRoutingModule { }
