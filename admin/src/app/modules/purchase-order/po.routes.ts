import { Routes } from '@angular/router';
import { PurchaseInvoiceCreateComponent } from './purchase-invoice';

export const purchaseOrderRoutes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'upload',
    loadComponent: () =>
      import('./purchase-order-upload/purchase-order-upload.component').then((m) => m.PurchaseOrderUploadComponent)
  },
  {
    path: 'manual',
    loadComponent: () =>
      import('./purchase-order-manual/purchase-order-manual.component').then((m) => m.PurchaseOrderManualComponent)
  },
  {
    path: 'review/:invoiceId',
    loadComponent: () =>
      import('./purchase-order-review/purchase-order-review.component').then((m) => m.PurchaseOrderReviewComponent)
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./purchase-order-list/purchase-order-list.component').then((m) => m.PurchaseOrderListComponent)
  },
  {
    path: 'invoice',
    loadComponent: () =>
      import('./purchase-invoice/purchase-invoice.component').then((m) => m.PurchaseInvoiceComponent)
  },
  {
    path: 'invoice/create',
    component: PurchaseInvoiceCreateComponent
  },
  {
    path: 'return',
    loadComponent: () =>
      import('./purchase-return/purchase-return.component').then((m) => m.PurchaseReturnComponent)
  }
];
