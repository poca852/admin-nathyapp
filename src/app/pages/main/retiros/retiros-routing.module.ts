import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RetirosPage } from './retiros.page';

const routes: Routes = [
  {
    path: '',
    component: RetirosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RetirosPageRoutingModule {}
