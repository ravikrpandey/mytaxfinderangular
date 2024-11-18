import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminMenuRoutingModule } from './admin-menu-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FiledQueriesComponent } from './queries/filed-queries/filed-queries.component';
import { AdminMainComponent } from '../admin.component';


@NgModule({
  declarations: [AdminMainComponent],
  imports: [
    CommonModule,
    AdminMenuRoutingModule
  ]
})
export class AdminMenuModule { }
