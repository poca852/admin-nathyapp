import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from 'src/app/shared/shared.module';
import { roleGuard } from 'src/app/guards/role.guard';
import { Roles } from 'src/app/models/roles.enum';

import { SuperAdminPage } from './super-admin.page';
import { SaEmpresasPage } from './empresas/sa-empresas.page';
import { SaEmpresaDetailPage } from './empresas/sa-empresa-detail.page';
import { SaUsuariosPage } from './usuarios/sa-usuarios.page';
import { SaUsuarioDetailPage } from './usuarios/sa-usuario-detail.page';
import { SaRutasPage } from './rutas/sa-rutas.page';
import { SaRutaDetailPage } from './rutas/sa-ruta-detail.page';
import { SaTransferenciasPage } from './transferencias/sa-transferencias.page';
import { SaOperacionesPage } from './operaciones/sa-operaciones.page';
import { SaCreditoDetailPage } from './operaciones/sa-credito-detail.page';
import { SaClienteDetailPage } from './operaciones/sa-cliente-detail.page';
import { SaPagoDetailPage } from './operaciones/sa-pago-detail.page';
import { SaCajaDetailPage } from './operaciones/sa-caja-detail.page';
import { SaOficinaDetailPage } from './operaciones/sa-oficina-detail.page';
import { SaMensajesPage } from './mensajes/sa-mensajes.page';
import { SaSolicitudesPage } from './solicitudes/sa-solicitudes.page';

const routes: Routes = [
  {
    path: '',
    component: SuperAdminPage,
    canActivate: [roleGuard],
    data: { roles: [Roles.superAdmin] },
    children: [
      { path: '', redirectTo: 'empresas', pathMatch: 'full' },
      { path: 'empresas', component: SaEmpresasPage },
      { path: 'empresas/:id', component: SaEmpresaDetailPage },
      { path: 'solicitudes', component: SaSolicitudesPage },
      { path: 'usuarios', component: SaUsuariosPage },
      { path: 'usuarios/:id', component: SaUsuarioDetailPage },
      { path: 'rutas', component: SaRutasPage },
      { path: 'rutas/:id', component: SaRutaDetailPage },
      { path: 'mensajes', component: SaMensajesPage },
      { path: 'transferencias', component: SaTransferenciasPage },
      { path: 'operaciones', component: SaOperacionesPage },
      { path: 'operaciones/credito/:id', component: SaCreditoDetailPage },
      { path: 'operaciones/cliente/:id', component: SaClienteDetailPage },
      { path: 'operaciones/pago/:id', component: SaPagoDetailPage },
      { path: 'operaciones/caja/:id', component: SaCajaDetailPage },
      { path: 'operaciones/oficina/:id', component: SaOficinaDetailPage },
    ],
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    SharedModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    SuperAdminPage,
    SaEmpresasPage,
    SaEmpresaDetailPage,
    SaSolicitudesPage,
    SaUsuariosPage,
    SaUsuarioDetailPage,
    SaRutasPage,
    SaRutaDetailPage,
    SaMensajesPage,
    SaTransferenciasPage,
    SaOperacionesPage,
    SaCreditoDetailPage,
    SaClienteDetailPage,
    SaPagoDetailPage,
    SaCajaDetailPage,
    SaOficinaDetailPage,
  ],
})
export class SuperAdminPageModule {}
