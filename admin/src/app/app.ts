import { Component, signal, inject, OnDestroy, effect } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ToastComponent } from './components/toast/toast.component';
import { AuthService } from './services/auth.service';
import { ApiService } from './services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, FormsModule, CommonModule, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnDestroy {
  protected readonly title = signal('infosys');
  protected searchTerm = '';
  protected readonly authService = inject(AuthService);
  protected readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  protected financialYears = this.authService.getFinancialYears();
  protected showEntityDropdown = false;
  protected showFinancialYearDropdown = false;
  protected showUserDropdown = false;
  protected currentDateTime = signal('');
  private timerId: any;

  constructor() {
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.loadUserEntityIfNeeded();
      }
    });
    this.updateDateTime();
    this.timerId = setInterval(() => this.updateDateTime(), 1000);
  }

  /**
   * Load user-scoped entity or admin entity list depending on user role
   */
  private loadUserEntityIfNeeded(): void {
    const user = this.authService.currentUser();
    if (!user) return;

    if (this.authService.isAdmin()) {
      this.loadAdminEntities();
    } else if (user.email) {
      this.apiService.getBusinessAccount(user.email, 'email').subscribe({
        next: (res) => {
          if (res.exists && res.data) {
            this.authService.switchEntity(res.data);
          }
        },
        error: (err) => {
          console.error('Failed to load user business entity:', err);
        }
      });
    }
  }

  /**
   * Load available entities for admin user
   */
  private loadAdminEntities(): void {
    const user = this.authService.currentUser();
    if (user && this.authService.isAdmin() && user.email) {
      this.apiService.getAdminEntities(user.email).subscribe({
        next: (entities) => {
          this.authService.setAdminEntities(entities);
          // If no current entity is set, set the first one
          if (!this.authService.getCurrentEntity() && entities.length > 0) {
            this.authService.switchEntity(entities[0]);
          }
        },
        error: (error) => {
          console.error('Failed to load admin entities:', error);
        }
      });
    }
  }

  /**
   * Switch to a different entity
   */
  protected switchEntity(entity: any): void {
    this.authService.switchEntity(entity);
    this.showEntityDropdown = false;
    // Optionally refresh data based on new entity
    console.log('✅ Switched to entity:', entity.companyName);
  }

  /**
   * Handle financial year change
   */
  protected changeFinancialYear(year: string): void {
    this.authService.setFinancialYear(year);
    this.showFinancialYearDropdown = false;
    console.log('✅ Financial year changed to:', year);
  }

  /**
   * Close all dropdowns
   */
  protected closeDropdowns(): void {
    this.showEntityDropdown = false;
    this.showFinancialYearDropdown = false;
    this.showUserDropdown = false;
  }

  /**
   * Handle dropdown button click (prevent closing)
   */
  protected onDropdownButtonClick(event: Event): void {
    event.stopPropagation();
  }

  protected updateDateTime(): void {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[now.getMonth()];
    const year = String(now.getFullYear()).slice(-2);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    this.currentDateTime.set(`${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`);
  }

  protected changePassword(): void {
    this.showUserDropdown = false;
    Swal.fire({
      title: 'Change Password',
      text: 'Enter your new password below:',
      input: 'password',
      inputPlaceholder: 'Enter your new password',
      inputAttributes: {
        autocapitalize: 'off',
        autocorrect: 'off'
      },
      showCancelButton: true,
      confirmButtonText: 'Change',
      confirmButtonColor: '#0f5e9c',
      cancelButtonColor: '#9ca3af',
      background: '#ffffff',
      preConfirm: (newPassword) => {
        if (!newPassword || newPassword.trim().length < 6) {
          Swal.showValidationMessage('Password must be at least 6 characters long');
        }
        return newPassword;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const username = this.authService.currentUser()?.name || '';
        this.apiService.updateUser(username, { password: result.value }).subscribe({
          next: () => {
            Swal.fire({
              title: 'Success!',
              text: 'Password updated successfully.',
              icon: 'success',
              confirmButtonColor: '#0f5e9c',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (err) => {
            Swal.fire({
              title: 'Error!',
              text: err.error?.message || 'Failed to update password',
              icon: 'error',
              confirmButtonColor: '#ef4444'
            });
          }
        });
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }
}
