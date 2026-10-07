import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { ReportesPageRoutingModule } from './reportes-routing.module';
import { ReportesPage } from './reportes.page';
import { SharedModule } from '../../../shared/shared.module';
import { CarteraClientesSheetComponent } from './components/cartera-clientes-sheet/cartera-clientes-sheet.component';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    SharedModule,
    ReportesPageRoutingModule,
    CarteraClientesSheetComponent,
  ],
  declarations: [ReportesPage],
})
export class ReportesPageModule {}
