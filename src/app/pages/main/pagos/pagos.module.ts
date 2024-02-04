import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';


import { PagosPageRoutingModule } from './pagos-routing.module';

import { PagosPage } from './pagos.page';
import { SharedModule } from '../../../shared/shared.module';
import { IonicModule } from '@ionic/angular';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    PagosPageRoutingModule,
    SharedModule,
  ],
  declarations: [PagosPage]
})
export class PagosPageModule {}
