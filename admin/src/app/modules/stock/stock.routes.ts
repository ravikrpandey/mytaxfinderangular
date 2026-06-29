import { Routes } from '@angular/router';

export const stockRoutes: Routes = [
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full'
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./product-list/product-list.component').then(m => m.ProductListComponent)
  },
  {
    path: 'products/create',
    loadComponent: () =>
      import('./product-create/product-create.component').then(m => m.ProductCreateComponent)
  },
  {
    path: 'products/edit/:id',
    loadComponent: () =>
      import('./product-create/product-create.component').then(m => m.ProductCreateComponent)
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./stock-transaction-list/stock-transaction-list.component').then(m => m.StockTransactionListComponent)
  },
  {
    path: 'transactions/create',
    loadComponent: () =>
      import('./stock-transaction-form/stock-transaction-form.component').then(m => m.StockTransactionFormComponent)
  },
  {
    path: 'transactions/edit/:id',
    loadComponent: () =>
      import('./stock-transaction-form/stock-transaction-form.component').then(m => m.StockTransactionFormComponent)
  },
  {
    path: 'transactions/preview/:id',
    loadComponent: () =>
      import('./stock-transaction-form/stock-transaction-form.component').then(m => m.StockTransactionFormComponent)
  }
];
