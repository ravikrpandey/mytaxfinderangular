import { Component, signal, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ToastComponent } from './components/toast/toast.component';
import { AuthService } from './services/auth.service';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, FormsModule, CommonModule, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('infosys');
  protected searchTerm = '';
  protected readonly authService = inject(AuthService);
  protected readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  protected financialYears = this.authService.getFinancialYears();
  protected showEntityDropdown = false;
  protected showFinancialYearDropdown = false;

  constructor() {
    this.loadAdminEntities();
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
  }

  /**
   * Handle dropdown button click (prevent closing)
   */
  protected onDropdownButtonClick(event: Event): void {
    event.stopPropagation();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
