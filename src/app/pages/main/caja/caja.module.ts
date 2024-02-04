import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';

import { CajaPageRoutingModule } from './caja-routing.module';

import { CajaPage } from './caja.page';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    SharedModule,
    CajaPageRoutingModule
  ],
  declarations: [CajaPage]
})
export class CajaPageModule {}
