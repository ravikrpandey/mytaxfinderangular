import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = signal('');
  password = signal('');
  phoneOrEmail = signal('');
  userId = signal('');
  selectedRole = signal<'admin' | 'user'>('admin');
  loginMode = signal<'phone-email' | 'user-id'>('phone-email');
  showPassword = signal(false);
  rememberMe = signal(false);
  error = signal('');
  isLoading = signal(false);
  showOtpInput = signal(false);
  otp = signal(['', '', '', '']);
  showAccountNotFoundModal = signal(false);
  resolvedLoginIdentifier = signal('');

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (this.loginMode() === 'phone-email' && !this.showOtpInput()) {
      // First, send OTP
      this.sendOtp();
    } else if (this.loginMode() === 'phone-email' && this.showOtpInput()) {
      // Verify OTP and login
      this.verifyOtpAndLogin();
    } else if (this.loginMode() === 'user-id') {
      // User ID login
      this.loginWithUserId();
    }
  }

  sendOtp(): void {
    const phoneOrEmail = this.phoneOrEmail().trim();
    if (!phoneOrEmail) {
      this.error.set('Please enter phone number or email');
      return;
    }

    this.error.set('');
    this.isLoading.set(true);

    const candidates = this.buildIdentifierCandidates(phoneOrEmail);
    this.checkBusinessAccountByCandidates(candidates, 0);
  }

  private checkBusinessAccountByCandidates(candidates: string[], index: number): void {
    if (index >= candidates.length) {
      this.isLoading.set(false);
      this.showAccountNotFoundModal.set(true);
      return;
    }

    const candidate = candidates[index];
    const queryKey: 'identifier' | 'email' = candidate.includes('@') ? 'email' : 'identifier';
    this.apiService.checkBusinessAccountExists(candidate, queryKey).subscribe({
      next: (response) => {
        if (response.exists) {
          this.isLoading.set(false);
          // Store full business account (with role_menu_access) as current entity
          if (response.data) {
            this.authService.switchEntity(response.data as any);
            this.selectedRole.set((response.data.role as 'admin' | 'user') || 'user');
          }
          this.resolvedLoginIdentifier.set(response.data?.email?.trim() || candidate);
          this.showOtpInput.set(true);
          setTimeout(() => {
            this.otp.set(['1', '2', '3', '4']);
          }, 500);
          return;
        }

        this.checkBusinessAccountByCandidates(candidates, index + 1);
      },
      error: () => {
        this.checkBusinessAccountByCandidates(candidates, index + 1);
      }
    });
  }

  private buildIdentifierCandidates(rawInput: string): string[] {
    const input = rawInput.trim();
    const candidates: string[] = [input];

    if (input.includes('@')) {
      candidates.push(input.toLowerCase());
    }

    const digitsOnly = input.replace(/\D/g, '');
    if (digitsOnly) {
      candidates.push(digitsOnly);

      if (digitsOnly.length === 10) {
        candidates.push(`+91${digitsOnly}`);
        candidates.push(`91${digitsOnly}`);
      }

      if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
        candidates.push(digitsOnly.slice(2));
      }
    }

    return [...new Set(candidates.filter(value => !!value))];
  }

  verifyOtpAndLogin(): void {
    const otpValue = this.otp().join('');
    if (otpValue.length !== 4) {
      this.error.set('Please enter complete OTP');
      return;
    }

    this.isLoading.set(true);
    
    // Simulate OTP verification
    setTimeout(() => {
      this.isLoading.set(false);
      
      // Set user and navigate
      this.authService.setUserFromApiResponse(
        'user',
        this.selectedRole(),
        this.resolvedLoginIdentifier() || this.phoneOrEmail().trim()
      );
      
      this.router.navigate(['/welcome']);
    }, 1000);
  }

  loginWithUserId(): void {
    const userId = this.userId();
    const password = this.password();
    
    if (!userId || !password) {
      this.error.set('Please enter user ID and password');
      return;
    }

    this.isLoading.set(true);
    
    const queryKey = userId.includes('@') ? 'email' : 'identifier';
    this.apiService.checkBusinessAccountExists(userId, queryKey).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        let role: 'admin' | 'user' = 'user';
        if (response.exists && response.data) {
          role = (response.data.role as 'admin' | 'user') || 'user';
          this.authService.switchEntity(response.data as any);
        } else if (userId === 'admin@example.com') {
          role = 'admin';
        }
        
        this.authService.setUserFromApiResponse(
          'user',
          role,
          userId
        );
        this.router.navigate(['/welcome']);
      },
      error: () => {
        this.isLoading.set(false);
        const role = userId === 'admin@example.com' ? 'admin' : 'user';
        this.authService.setUserFromApiResponse(
          'user',
          role,
          userId
        );
        this.router.navigate(['/welcome']);
      }
    });
  }

  onOtpInput(index: number, event: any): void {
    const value = event.target.value;
    
    if (value && index < 3) {
      // Move to next input
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }
    
    // Update OTP array
    const newOtp = [...this.otp()];
    newOtp[index] = value;
    this.otp.set(newOtp);
  }

  onOtpKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.otp()[index] && index > 0) {
      // Move to previous input on backspace
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
  }

  closeAccountNotFoundModal(): void {
    this.showAccountNotFoundModal.set(false);
  }

  createNewAccount(): void {
    this.showAccountNotFoundModal.set(false);
    const input = this.phoneOrEmail().trim();
    const isEmail = input.includes('@');
    const queryParams = isEmail
      ? { email: input }
      : { identifier: input.replace(/\D/g, '') || input };

    this.router.navigate(['/business-account'], {
      queryParams
    });
  }

  setRole(role: 'admin' | 'user'): void {
    this.selectedRole.set(role);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(value => !value);
  }

  switchToUserIdMode(): void {
    this.loginMode.set('user-id');
  }

  switchToPhoneEmailMode(): void {
    this.loginMode.set('phone-email');
  }
}

