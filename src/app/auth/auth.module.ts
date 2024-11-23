import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';

import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

// Routes for AuthModule
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
];

const firebaseConfig = {
  apiKey: "AIzaSyBMkenkMWjzUotsf-5-Jhji1ffWhG4lPpk",
  authDomain: "mytaxfinder-47e9a.firebaseapp.com",
  projectId: "mytaxfinder-47e9a",
  storageBucket: "mytaxfinder-47e9a.firebasestorage.app",
  messagingSenderId: "856252916415",
  appId: "1:856252916415:web:6bcf6f186134b19a851c0a",
  measurementId: "G-ZJCC54VK1H",
};

@NgModule({
  declarations: [LoginComponent, RegisterComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    // Firebase initialization
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
  ],
})
export class AuthModule {}
