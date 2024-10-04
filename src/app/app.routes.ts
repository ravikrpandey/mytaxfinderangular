import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { EnquiryFormComponent } from './home/enquiry-form/enquiry-form.component';
import { ServicesDetailsComponent } from './home/services-details/services-details.component';
import { FinancialPlanningComponent } from './home/financial-planning/financial-planning.component';
import { TaxCalculatorComponent } from './home/tax-calculator/tax-calculator.component';
import { BusinessRegistrationComponent } from './home/business-registration/business-registration.component';
import { HeaderComponent } from './home/header/header.component';
import { GstRegistrationAndReturnComponent } from './home/gst-registration-and-return/gst-registration-and-return.component';
import { TaxPlanningComponent } from './home/tax-planning/tax-planning.component';
import { AccountingServicesComponent } from './home/accounting-services/accounting-services.component';
import { TaxByRegionComponent } from './home/tax-by-region/tax-by-region.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  // { path: 'home', loadChildren: () => import('./home/home.module').then(m => m.HomeModule), canActivate: [AuthGuard] },
  { path: 'home', loadChildren: () => import('./home/home.module').then(m => m.HomeModule)},
  { path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
  {path: 'enquiryForm', component: EnquiryFormComponent},
  {path: 'services-details', component: ServicesDetailsComponent},
  {path: 'FinancialPlanning', component: FinancialPlanningComponent},
  {path: 'tax-calculator', component: TaxCalculatorComponent},
  {path: 'BusinessRegistration', component: BusinessRegistrationComponent},
  {path: 'gstRegistrationAndReturn', component: GstRegistrationAndReturnComponent},
  {path: 'taxPlanning', component: TaxPlanningComponent},
  {path: 'accountingService', component: AccountingServicesComponent},
  {path: 'tax-by-region', component: TaxByRegionComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
