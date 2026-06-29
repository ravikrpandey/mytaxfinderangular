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
  }
];
