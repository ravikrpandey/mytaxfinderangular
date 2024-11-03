import { NgModule,CUSTOM_ELEMENTS_SCHEMA  } from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { FinancialPlanningComponent } from './financial-planning/financial-planning.component';
import { ServicesDetailsComponent } from './services-details/services-details.component';
import { TaxCalculatorComponent } from './tax-calculator/tax-calculator.component';
import { BusinessRegistrationComponent } from './business-registration/business-registration.component';
import { EnquiryFormComponent } from './enquiry-form/enquiry-form.component';
import { GstRegistrationAndReturnComponent } from './gst-registration-and-return/gst-registration-and-return.component';
import { AccountingServicesComponent } from './accounting-services/accounting-services.component';
import { TaxPlanningComponent } from './tax-planning/tax-planning.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from '../app.component';
import { TaxByRegionComponent } from './tax-by-region/tax-by-region.component';
import { TermsAndConditionsComponent } from './terms-and-conditions/terms-and-conditions.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';

const routes: Routes = [
  { path: '', component: HomeComponent }
];

@NgModule({
  declarations: [
    HomeComponent,
    HeaderComponent,
    FooterComponent,
    FinancialPlanningComponent,
    ServicesDetailsComponent,
    TaxCalculatorComponent,
    BusinessRegistrationComponent,
    EnquiryFormComponent,
    GstRegistrationAndReturnComponent,
    AccountingServicesComponent,
    TaxPlanningComponent,
    TaxByRegionComponent,
    TermsAndConditionsComponent,
    PrivacyPolicyComponent

  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    HttpClientModule,
    ReactiveFormsModule,
    // BrowserAnimationsModule,
    MatSnackBarModule,
    FormsModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomeModule { }
