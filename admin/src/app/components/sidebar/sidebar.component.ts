import { Component, Input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService, Theme } from '../../services/theme.service';
import { RoleMenuAccess, RoleMenuAccessEntry } from '../../services/api.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() userName = '';
  @Input() isAdmin = false;
  @Input() menuAccess: RoleMenuAccess | null | undefined = null;
  
  showThemeMenu = false;
  isCollapsed = false;
  isMobileOpen = false;
  private expandedGroups: Record<string, boolean> = {};
  
  constructor(public themeService: ThemeService) {}
  
  toggleThemeMenu(): void {
    this.showThemeMenu = !this.showThemeMenu;
  }

  toggleSidebar(): void {
    if (window.innerWidth <= 768) {
      this.isMobileOpen = !this.isMobileOpen;
      return;
    }
    this.isCollapsed = !this.isCollapsed;
    document.body.classList.toggle('sidebar-collapsed', this.isCollapsed);
  }
  
  selectTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
    this.showThemeMenu = false;
  }
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.theme-selector')) {
      this.showThemeMenu = false;
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (window.innerWidth > 768) {
      this.isMobileOpen = false;
    }
  }

  getMenuEntry(key: string): RoleMenuAccessEntry | undefined {
    return this.menuAccess ? this.menuAccess[key] : undefined;
  }

  canView(key: string): boolean {
    const entry = this.getMenuEntry(key);
    if (!entry) {
      return true;
    }
    return entry.canView !== false;
  }

  toggleGroup(key: string): void {
    this.expandedGroups[key] = !this.isGroupExpanded(key);
  }

  isGroupExpanded(key: string): boolean {
    return this.expandedGroups[key] === true;
  }
}

