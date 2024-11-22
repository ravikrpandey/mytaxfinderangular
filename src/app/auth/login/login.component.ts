import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  otpForm: FormGroup;
  otpSent = false;

  constructor(private fb: FormBuilder, private afAuth: AngularFireAuth) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    });
  }

  signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    this.afAuth.signInWithPopup(provider).then((result) => {
      console.log('Logged in user:', result.user);
    }).catch((error) => {
      console.error('Error during Google login:', error);
    });
  }

  sendOtp() {
    const email = this.loginForm.value.email;
    // Call backend API to send OTP
    console.log('Sending OTP to:', email);
    this.otpSent = true; // Assume OTP is sent
  }

  verifyOtp() {
    const otp = this.otpForm.value.otp;
    // Call backend API to verify OTP
    console.log('Verifying OTP:', otp);
    // Redirect to the dashboard if OTP is correct
  }
}
