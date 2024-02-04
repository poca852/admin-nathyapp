import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { InversionesPageRoutingModule } from './inversiones-routing.module';

import { InversionesPage } from './inversiones.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InversionesPageRoutingModule
  ],
  declarations: [InversionesPage]
})
export class InversionesPageModule {}
