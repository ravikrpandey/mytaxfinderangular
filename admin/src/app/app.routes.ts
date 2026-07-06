import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'sales/return',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./components/signup/signup.component').then(m => m.SignupComponent)
  },
  {
    path: 'business-account',
    loadComponent: () => import('./modules/business-account/business-account.component').then(m => m.BusinessAccountComponent)
  },
  {
    path: 'welcome',
    loadComponent: () => import('./components/welcome/welcome.component').then(m => m.WelcomeComponent),
    canActivate: [authGuard]
  },
  {
    path: 'products',
    redirectTo: 'stock/products',
    pathMatch: 'full'
  },
  {
    path: 'transactions',
    loadComponent: () => import('./components/transactions/transactions.component').then(m => m.TransactionsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'alerts',
    loadComponent: () => import('./components/alerts/alerts.component').then(m => m.AlertsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'reports',
    loadComponent: () => import('./components/reports/reports.component').then(m => m.ReportsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'user-management',
    loadComponent: () => import('./components/user-management/user-management.component').then(m => m.UserManagementComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'invoices',
    loadComponent: () => import('./modules/invoice/invoice-listing/invoice-listing.component').then(m => m.InvoiceListingComponent),
    canActivate: [authGuard]
  },
  {
    path: 'invoices/create',
    loadComponent: () => import('./modules/invoice/invoice-create/invoice-create.component').then(m => m.InvoiceCreateComponent),
    canActivate: [authGuard]
  },
  {
    path: 'po',
    loadComponent: () => import('./modules/purchase-order/purchase-order-shell.component').then(m => m.PurchaseOrderShellComponent),
    loadChildren: () => import('./modules/purchase-order/po.routes').then(m => m.purchaseOrderRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'crm/organisation',
    loadComponent: () => import('./modules/crm/organisation-listing/organisation-listing.component').then(m => m.OrganisationListingComponent),
    canActivate: [authGuard]
  },
  {
    path: 'crm/organisation/create',
    loadComponent: () => import('./modules/crm/organisation-create/organisation-create.component').then(m => m.OrganisationCreateComponent),
    canActivate: [authGuard]
  },
  {
    path: 'crm/organisation/edit/:id',
    loadComponent: () => import('./modules/crm/organisation-create/organisation-create.component').then(m => m.OrganisationCreateComponent),
    canActivate: [authGuard]
  },
  {
    path: 'crm/organisation/preview/:id',
    loadComponent: () => import('./modules/crm/organisation-create/organisation-create.component').then(m => m.OrganisationCreateComponent),
    canActivate: [authGuard]
  },
  {
    path: 'crm/master-data',
    loadComponent: () => import('./modules/crm/master-data-admin/master-data-admin.component').then(m => m.MasterDataAdminComponent),
    canActivate: [authGuard]
  },
  {
    path: 'stock',
    loadChildren: () => import('./modules/stock/stock.routes').then(m => m.stockRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'sales',
    loadChildren: () => import('./modules/sales/sales.routes').then(m => m.salesRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'receipt',
    loadChildren: () => import('./modules/receipt/receipt.routes').then(m => m.receiptRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'payment',
    loadChildren: () => import('./modules/payment/payment.routes').then(m => m.paymentRoutes),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

