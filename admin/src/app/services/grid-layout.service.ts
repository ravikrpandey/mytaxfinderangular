import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GridApi, ColumnState } from 'ag-grid-community';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

/**
 * Service to persist and restore Ag-Grid column layout (widths + order) in the database
 */
@Injectable({ providedIn: 'root' })
export class GridLayoutService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/client-user/meta-data/grid-layout`;

  constructor(
    private readonly authService: AuthService,
    private readonly http: HttpClient
  ) {}

  /**
   * Save the current column state (widths, order, pinned, visibility) to the database.
   */
  saveLayout(moduleKey: string, gridApi: GridApi): void {
    const state = gridApi.getColumnState();
    const currentUser = this.authService.currentUser();
    
    const payload = {
      userId: currentUser?.id ? parseInt(currentUser.id, 10) : null,
      userEmail: currentUser?.email || null,
      role: currentUser?.role || 'user',
      moduleKey,
      layoutState: JSON.stringify(state)
    };

    this.http.post(`${this.apiUrl}/save`, payload).subscribe({
      next: () => console.log(`Layout saved for ${moduleKey}`),
      error: (err) => console.error(`Failed to save layout for ${moduleKey}:`, err)
    });
  }

  /**
   * Restore the saved column state from the database.
   * Always returns true to prevent the caller component from synchronously overriding the layout.
   */
  restoreLayout(moduleKey: string, gridApi: GridApi): boolean {
    const currentUser = this.authService.currentUser();
    const role = currentUser?.role || 'user';
    const userId = currentUser?.id ? parseInt(currentUser.id, 10) : null;
    const userEmail = currentUser?.email || null;

    let params = `?moduleKey=${moduleKey}&role=${role}`;
    if (userId) params += `&userId=${userId}`;
    if (userEmail) params += `&userEmail=${userEmail}`;

    this.http.get<{ success: boolean; data?: any }>(`${this.apiUrl}/get${params}`).subscribe({
      next: (res) => {
        if (res && res.success && res.data && res.data.layoutState) {
          try {
            const state: ColumnState[] = JSON.parse(res.data.layoutState);
            gridApi.applyColumnState({ state, applyOrder: true });
          } catch (e) {
            console.error('Error parsing grid state:', e);
            gridApi.sizeColumnsToFit();
          }
        } else {
          gridApi.sizeColumnsToFit();
        }
      },
      error: (err) => {
        console.error('Failed to load layout from DB:', err);
        gridApi.sizeColumnsToFit();
      }
    });

    return true;
  }

  /**
   * Delete the saved layout from database and reset UI grid to default.
   */
  resetLayout(moduleKey: string, gridApi: GridApi, defaultColDefs: any[]): void {
    const currentUser = this.authService.currentUser();
    const role = currentUser?.role || 'user';
    const userId = currentUser?.id ? parseInt(currentUser.id, 10) : null;
    const userEmail = currentUser?.email || null;

    let params = `?moduleKey=${moduleKey}&role=${role}`;
    if (userId) params += `&userId=${userId}`;
    if (userEmail) params += `&userEmail=${userEmail}`;

    this.http.delete(`${this.apiUrl}/reset${params}`).subscribe({
      next: () => console.log(`Layout reset in DB for ${moduleKey}`),
      error: (err) => console.error(`Failed to reset layout for ${moduleKey}:`, err)
    });

    // Reset UI grid immediately to default state derived from columnDefs
    const defaultState: ColumnState[] = defaultColDefs.map(col => ({
      colId: col.field ?? col.colId ?? '',
      width: col.width,
      pinned: col.pinned ?? null,
      hide: col.hide ?? false,
      sort: null,
      sortIndex: null,
    }));
    gridApi.applyColumnState({ state: defaultState, applyOrder: true });
  }

  /** Check if a saved layout exists (legacy fallback, returns false) */
  hasLayout(moduleKey: string): boolean {
    return false;
  }
}
