import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';

import { DetailClientePageRoutingModule } from './detail-cliente-routing.module';

import { DetailClientePage } from './detail-cliente.page';
import { SharedModule } from '../../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    SharedModule,
    DetailClientePageRoutingModule
  ],
  declarations: [DetailClientePage]
})
export class DetailClientePageModule {}
