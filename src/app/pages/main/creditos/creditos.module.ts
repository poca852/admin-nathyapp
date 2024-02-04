import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';

import { CreditosPageRoutingModule } from './creditos-routing.module';

import { CreditosPage } from './creditos.page';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    SharedModule,
    CreditosPageRoutingModule
  ],
  declarations: [CreditosPage]
})
export class CreditosPageModule {}
