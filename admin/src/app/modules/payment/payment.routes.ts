import { Routes } from '@angular/router';

export const paymentRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./payment-list/payment-list.component').then(m => m.PaymentListComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./payment-form/payment-form.component').then(m => m.PaymentFormComponent),
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./payment-form/payment-form.component').then(m => m.PaymentFormComponent),
  },
  {
    path: 'preview/:id',
    loadComponent: () =>
      import('./payment-form/payment-form.component').then(m => m.PaymentFormComponent),
  },
];
