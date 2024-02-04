import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DetailClientePage } from './detail-cliente.page';

const routes: Routes = [
  {
    path: '',
    component: DetailClientePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DetailClientePageRoutingModule {}
