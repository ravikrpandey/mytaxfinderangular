import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RoleMenuAccess } from './api.service';

export interface User {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  name: string;
}

export interface Entity {
  id?: string | number;
  companyName: string;
  email: string;
  identifier: string;
  fullName?: string;
  gstin?: string;
  state?: string;
  city?: string;
  role?: string;
  role_menu_access?: RoleMenuAccess;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'currentUser';
  private readonly USERS_KEY = 'users';
  private readonly CURRENT_ENTITY_KEY = 'currentEntity';
  private readonly SELECTED_FINANCIAL_YEAR_KEY = 'selectedFinancialYear';
  
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);
  currentEntity = signal<Entity | null>(null);
  selectedFinancialYear = signal<string>('');
  adminEntities = signal<Entity[]>([]);

  constructor(private router: Router) {
    this.loadUserFromStorage();
    this.loadEntityFromStorage();
    this.loadFinancialYearFromStorage();
  }

  // Initialize with default admin user if no users exist
  private initializeUsers(): void {
    const users = this.getUsers();
    if (users.length === 0) {
      const defaultAdmin: User = {
        id: '1',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        name: 'Admin User'
      };
      users.push(defaultAdmin);
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    }
  }

  signup(email: string, password: string, name: string): boolean {
    this.initializeUsers();
    const users = this.getUsers();
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return false;
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      password, // In production, hash this password
      role: 'user',
      name
    };

    users.push(newUser);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    return true;
  }

  createUser(email: string, password: string, name: string, role: 'admin' | 'user' = 'user'): boolean {
    this.initializeUsers();
    const users = this.getUsers();
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return false;
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      password, // In production, hash this password
      role,
      name
    };

    users.push(newUser);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    return true;
  }

  login(email: string, password: string): boolean {
    this.initializeUsers();
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      // Remove password before storing
      const { password: _, ...userWithoutPassword } = user;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userWithoutPassword));
      this.currentUser.set(user);
      this.isAuthenticated.set(true);
      return true;
    }

    return false;
  }

  /**
   * Set user from API login response
   * @param username - Username from API response
   * @param role - Role from API response
   * @param email - Optional email (can be same as username if not provided)
   */
  setUserFromApiResponse(username: string, role: 'admin' | 'user', email?: string): void {
    const user: User = {
      id: Date.now().toString(),
      email: email || username,
      password: '', // Password not stored after login
      role: role as 'admin' | 'user',
      name: username
    };

    // Remove password before storing
    const { password: _, ...userWithoutPassword } = user;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userWithoutPassword));
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.CURRENT_ENTITY_KEY);
    localStorage.removeItem('entityId');
    this.currentUser.set(null);
    this.currentEntity.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  private loadUserFromStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      const user = JSON.parse(stored);
      // Get full user with password from users list
      const users = this.getUsers();
      const fullUser = users.find(u => u.id === user.id);
      if (fullUser) {
        this.currentUser.set(fullUser);
        this.isAuthenticated.set(true);
        return;
      }

      // Fallback for API/OTP login users who are not persisted in local users list
      this.currentUser.set({
        id: user.id,
        email: user.email,
        password: '',
        role: user.role,
        name: user.name
      });
      this.isAuthenticated.set(true);
    }
  }

  getUsers(): User[] {
    const stored = localStorage.getItem(this.USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'admin';
  }

  getUserById(id: string): User | undefined {
    return this.getUsers().find(u => u.id === id);
  }

  updateUser(userId: string, updates: Partial<User>): boolean {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      
      // Update current user if it's the logged-in user
      if (this.currentUser()?.id === userId) {
        this.currentUser.set(users[index]);
        const { password: _, ...userWithoutPassword } = users[index];
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userWithoutPassword));
      }
      return true;
    }
    return false;
  }

  deleteUser(userId: string): boolean {
    const users = this.getUsers();
    const filtered = users.filter(u => u.id !== userId);
    if (filtered.length < users.length) {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(filtered));
      
      // If deleted user is current user, logout
      if (this.currentUser()?.id === userId) {
        this.logout();
      }
      return true;
    }
    return false;
  }

  // ==================== ENTITY MANAGEMENT ====================

  /**
   * Set available entities for admin
   */
  setAdminEntities(entities: Entity[]): void {
    this.adminEntities.set(entities);
  }

  /**
   * Switch to a different entity
   */
  switchEntity(entity: Entity): void {
    localStorage.setItem(this.CURRENT_ENTITY_KEY, JSON.stringify(entity));
    if (entity && entity.id != null) {
      localStorage.setItem('entityId', entity.id.toString());
    }
    this.currentEntity.set(entity);
  }

  /**
   * Get current selected entity
   */
  getCurrentEntity(): Entity | null {
    return this.currentEntity();
  }

  /**
   * Load current entity from storage
   */
  private loadEntityFromStorage(): void {
    const stored = localStorage.getItem(this.CURRENT_ENTITY_KEY);
    if (stored) {
      try {
        const entity = JSON.parse(stored);
        this.currentEntity.set(entity);
      } catch (e) {
        console.error('Failed to load entity from storage:', e);
      }
    }
  }

  /**
   * Get current financial year
   */
  getCurrentFinancialYear(): string {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    // Financial year in India: April to March
    if (currentMonth >= 4) {
      return `${currentYear}-${currentYear + 1}`;
    } else {
      return `${currentYear - 1}-${currentYear}`;
    }
  }

  /**
   * Get list of financial years (previous 5 years to next year)
   */
  getFinancialYears(): string[] {
    const currentYear = new Date().getFullYear();
    const years: string[] = [];

    for (let i = -5; i <= 1; i++) {
      const year = currentYear + i;
      years.push(`${year}-${year + 1}`);
    }

    return years;
  }

  /**
   * Set selected financial year
   */
  setFinancialYear(year: string): void {
    localStorage.setItem(this.SELECTED_FINANCIAL_YEAR_KEY, year);
    this.selectedFinancialYear.set(year);
  }

  /**
   * Get selected financial year
   */
  getSeletedFinancialYear(): string {
    return this.selectedFinancialYear();
  }

  /**
   * Load financial year from storage
   */
  private loadFinancialYearFromStorage(): void {
    const stored = localStorage.getItem(this.SELECTED_FINANCIAL_YEAR_KEY);
    if (stored) {
      this.selectedFinancialYear.set(stored);
    } else {
      // Set default financial year if not in storage
      this.selectedFinancialYear.set(this.getCurrentFinancialYear());
    }
  }
}

