import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon'; // Correct import for MatIconModule
import { ActionCellRendererComponent } from './components/action-cell-renderer/action-cell-renderer.component';

@NgModule({
  declarations: [ActionCellRendererComponent],
  imports: [
    CommonModule,
    MatIconModule, // Make sure MatIconModule is imported
  ],
  exports: [ActionCellRendererComponent],
  
})
export class SharedModule { }
