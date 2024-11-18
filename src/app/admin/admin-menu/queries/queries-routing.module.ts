import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { FiledQueriesComponent } from './filed-queries/filed-queries.component';

const routes: Routes = [
  {path: '', component: FiledQueriesComponent},
  {path: 'filed', component: FiledQueriesComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class QueriesRoutingModule { }
