import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { SeguimientoPageRoutingModule } from './seguimiento-routing.module';
import { SeguimientoPage } from './seguimiento.page';
import { SharedModule } from '../../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    SeguimientoPageRoutingModule,
  ],
  declarations: [SeguimientoPage],
})
export class SeguimientoPageModule {}
