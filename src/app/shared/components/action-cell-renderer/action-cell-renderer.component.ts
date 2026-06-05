import { Component } from '@angular/core';

@Component({
  selector: 'app-action-cell-renderer',
  template: `
    <!-- <button
      mat-icon-button
      (click)="onEdit()"
      title="Edit"
      class="edit-button">
      <mat-icon>edit</mat-icon>
    </button> -->
  `,
  styles: [`
    .edit-button {
      color: #1976d2; /* Optional: Customize the color */
      cursor: pointer;
    }
  `]
})
export class ActionCellRendererComponent {
  params: any;

  agInit(params: any): void {
    this.params = params;
  }

  onEdit() {
    this.params.context.componentParent.onEditRow(this.params.data);
  }
}
