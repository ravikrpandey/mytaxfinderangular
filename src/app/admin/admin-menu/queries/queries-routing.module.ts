import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { FiledQueriesComponent } from './filed/list-filed-queries/filed-queries.component';
import { EditFiledQueriesComponent } from './filed/edit-filed-queries/edit-filed-queries.component';

const routes: Routes = [
  {path: '', component: FiledQueriesComponent},
  {path: 'list-filed', component: FiledQueriesComponent},
  {path: 'edit-filed-queries', component: EditFiledQueriesComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule,]
})
export class QueriesRoutingModule { }
