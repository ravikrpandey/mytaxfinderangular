import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';

import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { MatIconModule } from '@angular/material/icon';

// Define routes for the module
const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' }, // Redirect empty path to login
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent }
];

@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule, // Add forms support
    RouterModule.forChild(routes), // Register child routes
    MatButtonModule, // Add Angular Material components
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    AngularFireAuthModule 

  ]
})
export class AuthModule { }
