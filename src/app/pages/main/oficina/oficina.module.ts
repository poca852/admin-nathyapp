import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';

import { OficinaPageRoutingModule } from './oficina-routing.module';

import { OficinaPage } from './oficina.page';
import { SharedModule } from '../../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    SharedModule,
    OficinaPageRoutingModule
  ],
  declarations: [OficinaPage]
})
export class OficinaPageModule {}
