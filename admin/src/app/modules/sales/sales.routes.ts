import { Routes } from '@angular/router';

export const salesRoutes: Routes = [
  {
    path: '',
    redirectTo: 'proforma-invoice',
    pathMatch: 'full'
  },
  {
    path: 'proforma-invoice',
    loadComponent: () =>
      import('./proforma-invoice-list/proforma-invoice-list.component').then(m => m.ProformaInvoiceListComponent)
  },
  {
    path: 'proforma-invoice/create',
    loadComponent: () =>
      import('./proforma-invoice-form/proforma-invoice-form.component').then(m => m.ProformaInvoiceFormComponent)
  },
  {
    path: 'proforma-invoice/edit/:id',
    loadComponent: () =>
      import('./proforma-invoice-form/proforma-invoice-form.component').then(m => m.ProformaInvoiceFormComponent)
  },
  {
    path: 'proforma-invoice/preview/:id',
    loadComponent: () =>
      import('./proforma-invoice-form/proforma-invoice-form.component').then(m => m.ProformaInvoiceFormComponent)
  },
  {
    path: 'sales-order',
    loadComponent: () =>
      import('./sales-order-list/sales-order-list.component').then(m => m.SalesOrderListComponent)
  },
  {
    path: 'sales-order/create',
    loadComponent: () =>
      import('./sales-order-form/sales-order-form.component').then(m => m.SalesOrderFormComponent)
  },
  {
    path: 'sales-order/edit/:id',
    loadComponent: () =>
      import('./sales-order-form/sales-order-form.component').then(m => m.SalesOrderFormComponent)
  },
  {
    path: 'sales-order/preview/:id',
    loadComponent: () =>
      import('./sales-order-form/sales-order-form.component').then(m => m.SalesOrderFormComponent)
  },
  {
    path: 'sales-invoice',
    loadComponent: () =>
      import('./sales-invoice-list/sales-invoice-list.component').then(m => m.SalesInvoiceListComponent)
  },
  {
    path: 'sales-invoice/create',
    loadComponent: () =>
      import('./sales-invoice-form/sales-invoice-form.component').then(m => m.SalesInvoiceFormComponent)
  },
  {
    path: 'sales-invoice/edit/:id',
    loadComponent: () =>
      import('./sales-invoice-form/sales-invoice-form.component').then(m => m.SalesInvoiceFormComponent)
  },
  {
    path: 'sales-invoice/preview/:id',
    loadComponent: () =>
      import('./sales-invoice-form/sales-invoice-form.component').then(m => m.SalesInvoiceFormComponent)
  },
  {
    path: 'return',
    loadComponent: () =>
      import('./sales-return-list/sales-return-list.component').then(m => m.SalesReturnListComponent)
  },
  {
    path: 'return/create',
    loadComponent: () =>
      import('./sales-return-form/sales-return-form.component').then(m => m.SalesReturnFormComponent)
  },
  {
    path: 'return/edit/:id',
    loadComponent: () =>
      import('./sales-return-form/sales-return-form.component').then(m => m.SalesReturnFormComponent)
  },
  {
    path: 'return/preview/:id',
    loadComponent: () =>
      import('./sales-return-form/sales-return-form.component').then(m => m.SalesReturnFormComponent)
  }
];
