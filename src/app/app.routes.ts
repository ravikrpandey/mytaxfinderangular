import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { EnquiryFormComponent } from './home/enquiry-form/enquiry-form.component';
import { ServicesDetailsComponent } from './home/services-details/services-details.component';
import { FinancialPlanningComponent } from './home/financial-planning/financial-planning.component';
import { TaxCalculatorComponent } from './home/tax-calculator/tax-calculator.component';
import { BusinessRegistrationComponent } from './home/business-registration/business-registration.component';
import { GstRegistrationAndReturnComponent } from './home/gst-registration-and-return/gst-registration-and-return.component';
import { TaxPlanningComponent } from './home/tax-planning/tax-planning.component';
import { AccountingServicesComponent } from './home/accounting-services/accounting-services.component';
import { TaxByRegionComponent } from './home/tax-by-region/tax-by-region.component';
import { TermsAndConditionsComponent } from './home/terms-and-conditions/terms-and-conditions.component';
import { PrivacyPolicyComponent } from './home/privacy-policy/privacy-policy.component';

// Optional: Import a PageNotFoundComponent for unmatched routes
// import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

export const routes: Routes = [
  // Default route
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  // Lazy-loaded modules
  { path: 'home', loadChildren: () => import('./home/home.module').then(m => m.HomeModule) },
  { path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
  { path: 'admin', loadChildren: () => import('./admin/admin-menu/admin-menu.module').then(m => m.AdminMenuModule) },

  // Feature routes
  { path: 'enquiry-form', component: EnquiryFormComponent },
  { path: 'services-details', component: ServicesDetailsComponent },
  { path: 'financial-planning', component: FinancialPlanningComponent },
  { path: 'tax-calculator', component: TaxCalculatorComponent },
  { path: 'business-registration', component: BusinessRegistrationComponent },
  { path: 'gst-registration-and-return', component: GstRegistrationAndReturnComponent },
  { path: 'tax-planning', component: TaxPlanningComponent },
  { path: 'accounting-services', component: AccountingServicesComponent },
  { path: 'tax-by-region', component: TaxByRegionComponent },
  { path: 'terms-of-service', component: TermsAndConditionsComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },

  // Wildcard route (optional, uncomment if `PageNotFoundComponent` is available)
  // { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
