import { Routes } from '@angular/router';

export const receiptRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./receipt-list/receipt-list.component').then(m => m.ReceiptListComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./receipt-form/receipt-form.component').then(m => m.ReceiptFormComponent),
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./receipt-form/receipt-form.component').then(m => m.ReceiptFormComponent),
  },
  {
    path: 'preview/:id',
    loadComponent: () =>
      import('./receipt-form/receipt-form.component').then(m => m.ReceiptFormComponent),
  },
];
