import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OficinaPage } from './oficina.page';

const routes: Routes = [
  {
    path: '',
    component: OficinaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OficinaPageRoutingModule {}
