import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QueriesRoutingModule } from './queries-routing.module';
import { FiledQueriesComponent } from './filed/list-filed-queries/filed-queries.component';
import { HomeQueriesComponent } from './home-queries/home-queries.component';
import { AgGridModule } from 'ag-grid-angular';
import { ReactiveFormsModule } from '@angular/forms';
import { EditFiledQueriesComponent } from './filed/edit-filed-queries/edit-filed-queries.component';
import { ActionCellRendererComponent } from '../../../shared/components/action-cell-renderer/action-cell-renderer.component';


@NgModule({
  declarations: [FiledQueriesComponent, HomeQueriesComponent, EditFiledQueriesComponent],
  imports: [
    CommonModule,
    QueriesRoutingModule,
    AgGridModule,
    ReactiveFormsModule,
    
  ]
})
export class QueriesModule { }
