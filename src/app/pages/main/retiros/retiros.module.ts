import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RetirosPageRoutingModule } from './retiros-routing.module';

import { RetirosPage } from './retiros.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RetirosPageRoutingModule
  ],
  declarations: [RetirosPage]
})
export class RetirosPageModule {}
