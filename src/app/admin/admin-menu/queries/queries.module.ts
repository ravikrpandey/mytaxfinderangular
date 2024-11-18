import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QueriesRoutingModule } from './queries-routing.module';
import { FiledQueriesComponent } from './filed-queries/filed-queries.component';
import { HomeQueriesComponent } from './home-queries/home-queries.component';


@NgModule({
  declarations: [FiledQueriesComponent, HomeQueriesComponent],
  imports: [
    CommonModule,
    QueriesRoutingModule
  ]
})
export class QueriesModule { }
