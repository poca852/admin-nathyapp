import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import mapboxgl from 'mapbox-gl';
import { HeaderComponent } from './components/header/header.component';
import { LogoComponent } from './components/logo/logo.component';
import { CustomInputComponent } from './components/custom-input/custom-input.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { CardRutaComponent } from './components/card-ruta/card-ruta.component';
import { SelectRutaComponent } from './components/selec-ruta/select-ruta.component';
import { TablePagosComponent } from './components/table-pagos/table-pagos.component';
import { AddUpdateEmployeComponent } from './components/add-update-employe/add-update-employe.component';
import { AddUpdateRutaComponent } from './components/add-update-ruta/add-update-ruta.component';
import { UpdateClienteComponent } from './components/update-cliente/update-cliente.component';
import { ViewImageComponent } from './components/view-image/view-image.component';
import { ModalHistorialCreditoComponent } from './components/modal-historial-credito/modal-historial-credito.component';
import { UpdatePagoComponent } from './components/update-pago/update-pago.component';
import { UpdateGastoComponent } from './components/update-gasto/update-gasto.component';
import { RutaModalComponent } from './components/ruta-modal/ruta-modal.component';
import { UpdateEmpresaComponent } from './components/update-empresa/update-empresa.component';
import { UpdateCreditoComponent } from './components/update-credito/update-credito.component';
import { MapModalComponent } from './components/map-modal/map-modal.component';
import { environment } from 'src/environments/environment';
import { UpdateUserComponent } from './components/update-user/update-user.component';

mapboxgl.accessToken = environment.mapbox_token;


@NgModule({
  declarations: [
    HeaderComponent,
    LogoComponent,
    CustomInputComponent,
    SelectRutaComponent,
    SearchBarComponent,
    CardRutaComponent,
    TablePagosComponent,
    AddUpdateEmployeComponent,
    AddUpdateRutaComponent,
    UpdateClienteComponent,
    ViewImageComponent,
    ModalHistorialCreditoComponent,
    UpdatePagoComponent,
    UpdateGastoComponent,
    RutaModalComponent,
    UpdateEmpresaComponent,
    UpdateCreditoComponent,
    MapModalComponent,
    UpdateUserComponent,
  ],
  exports: [
    ReactiveFormsModule,
    HeaderComponent,
    LogoComponent,
    CustomInputComponent,
    SearchBarComponent,
    SelectRutaComponent,
    CardRutaComponent,
    TablePagosComponent,
    AddUpdateEmployeComponent,
    AddUpdateRutaComponent,
    UpdateClienteComponent,
    ViewImageComponent,
    ModalHistorialCreditoComponent,
    UpdatePagoComponent,
    UpdateGastoComponent,
    RutaModalComponent,
    UpdateEmpresaComponent,
    UpdateCreditoComponent,
    MapModalComponent,
    UpdateUserComponent,
  ],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule
  ]
})
export class SharedModule { }
