import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';

import { RuteroPageRoutingModule } from './home-routing.module';

import { HomePage } from './home.page';
import { SharedModule } from '../../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    SharedModule,
    RuteroPageRoutingModule
  ],
  declarations: [HomePage]
})
export class HomePageModule {}
