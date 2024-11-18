import { Component } from '@angular/core';

@Component({
  selector: 'app-action-cell-renderer',
  templateUrl: './action-cell-renderer.component.html',
  styleUrls: ['./action-cell-renderer.component.scss']
})
export class ActionCellRendererComponent {
  params: any;

  agInit(params: any): void {
    this.params = params;
  }

  onEditClick() {
    this.params.context.componentParent.onEditRow(this.params.data);
  }
}
