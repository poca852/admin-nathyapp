import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';


import { RenovacionesPageRoutingModule } from './renovaciones-routing.module';

import { RenovacionesPage } from './renovaciones.page';
import { SharedModule } from '../../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    SharedModule,
    RenovacionesPageRoutingModule
  ],
  declarations: [RenovacionesPage]
})
export class RenovacionesPageModule {}
