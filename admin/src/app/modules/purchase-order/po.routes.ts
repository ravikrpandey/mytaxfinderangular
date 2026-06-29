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
    path: 'manual/edit/:id',
    loadComponent: () =>
      import('./purchase-order-manual/purchase-order-manual.component').then((m) => m.PurchaseOrderManualComponent)
  },
  {
    path: 'manual/preview/:id',
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
  },
  {
    path: 'return/create',
    loadComponent: () =>
      import('./purchase-return/purchase-return-form/purchase-return-form.component').then((m) => m.PurchaseReturnFormComponent)
  },
  {
    path: 'return/edit/:id',
    loadComponent: () =>
      import('./purchase-return/purchase-return-form/purchase-return-form.component').then((m) => m.PurchaseReturnFormComponent)
  },
  {
    path: 'return/preview/:id',
    loadComponent: () =>
      import('./purchase-return/purchase-return-form/purchase-return-form.component').then((m) => m.PurchaseReturnFormComponent)
  }
];
