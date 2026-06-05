import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminMenuRoutingModule } from './admin-menu-routing.module';
import { AdminMainComponent } from '../admin.component';
import { AgGridModule } from 'ag-grid-angular';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [AdminMainComponent],
  imports: [
    CommonModule,
    AdminMenuRoutingModule,
    AgGridModule,
    ReactiveFormsModule
  ]
})
export class AdminMenuModule { }
