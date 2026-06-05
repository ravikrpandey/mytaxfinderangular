import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonService } from '../../shared/services/common.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
// import { GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth';
// import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  otpForm: FormGroup;
  otpSent = false;
  

  constructor(private fb: FormBuilder, 
    private commonService: CommonService, 
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    });
  }

  ngOnInit() {
    if(localStorage.getItem('email')) {
      this.router.navigate(['/admin']);
    }
  }

  signInWithGoogle() {
    // const provider = new GoogleAuthProvider();
    // this.afAuth.signInWithPopup(provider).then((result) => {
    //   console.log('Logged in user:', result.user);
    // }).catch((error) => {
    //   console.error('Error during Google login:', error);
    // });
  }

  sendOtp() {
    debugger
    const email = this.loginForm.value.email;
    if (email) {
      this.commonService.registerUser(email).subscribe((res: any) => {
        if (res.success == true) {
          this.otpSent = true;
          this.showSuccessNotification(res.message)
        }else {
          this.showErrorNotification(res.message)
        }
      })
    }
  }

  verifyOtp() {
    debugger
    const otp = this.otpForm.value.otp;
    const email = this.loginForm.value.email;
    if (otp) {
      this.commonService.verifyUser(otp, email).subscribe((res: any) => {
        if (res.success === true && res.data.usertType == 'admin') {
          localStorage.setItem('email', email);
          this.router.navigate(['/admin']);
          this.showSuccessNotification(res.message)
        }else {
          this.showErrorNotification(res.message)
        }
      })
    }
  }

    // Show success notification
    showSuccessNotification(message: string) {
      this.snackBar.open(message, 'Close', {
        duration: 4000,
        panelClass: ['snackbar-success']
      });
    }
  
    // Show error notification
    showErrorNotification(message: string) {
      this.snackBar.open(message, 'Close', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
    }
}
