import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RenovacionesPage } from './renovaciones.page';

const routes: Routes = [
  {
    path: '',
    component: RenovacionesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RenovacionesPageRoutingModule {}
