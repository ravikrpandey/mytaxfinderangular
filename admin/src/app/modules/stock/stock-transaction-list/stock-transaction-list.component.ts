import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, SelectionChangedEvent, GridApi } from 'ag-grid-community';
import { StockTransactionService, StockTransaction } from '../../../services/stock-transaction.service';
import { ToastService } from '../../../services/toast.service';
import { GridLayoutService } from '../../../services/grid-layout.service';

interface StockTransactionGridRow extends StockTransaction {
  srNo: number;
  stockDateText: string;
  createdDateText: string;
  updatedDateText: string;
}

@Component({
  selector: 'app-stock-transaction-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AgGridAngular, RouterModule],
  templateUrl: './stock-transaction-list.component.html',
  styleUrl: './stock-transaction-list.component.scss'
})
export class StockTransactionListComponent implements OnInit {
  filterForm: FormGroup;
  rows: StockTransaction[] = [];
  gridRows: StockTransactionGridRow[] = [];
  loading = signal(true);
  error = signal<string | null>(null);
  selectedTx: StockTransactionGridRow | null = null;
  private gridApi!: GridApi<StockTransactionGridRow>;
  readonly LAYOUT_KEY = 'stock_transaction_list';

  readonly rowSelection: 'single' = 'single';
  readonly overlayNoRowsTemplate = '<span class="stk-grid-empty">No Rows To Show</span>';
  
  readonly defaultColDef: ColDef<StockTransactionGridRow> = {
    sortable: false,
    resizable: true
  };

  readonly columnDefs: ColDef<StockTransactionGridRow>[] = [
    {
      headerName: 'STOCK TYPE',
      field: 'stockType',
      width: 140,
      minWidth: 120,
      pinned: 'left'
    },
    {
      headerName: 'STATUS',
      field: 'status',
      width: 120,
      minWidth: 110,
    },
    {
      headerName: 'STOCK NO',
      field: 'stockNo',
      width: 140,
      minWidth: 120,
    },
    {
      headerName: 'STOCK DATE',
      field: 'stockDateText',
      width: 130,
      minWidth: 110,
    },
    {
      headerName: 'REFERENCE',
      field: 'reference',
      width: 180,
      minWidth: 140,
    },
    {
      headerName: 'CREATEDBY',
      field: 'createdBy',
      width: 150,
      minWidth: 120,
    },
    {
      headerName: 'CREATEDDATE',
      field: 'createdDateText',
      width: 180,
      minWidth: 150,
    },
    {
      headerName: 'UPDATEDBY',
      field: 'updatedBy',
      width: 150,
      minWidth: 120,
    },
    {
      headerName: 'UPDATEDDATE',
      field: 'updatedDateText',
      width: 180,
      minWidth: 150,
    }
  ];

  constructor(
    private readonly stockTxService: StockTransactionService,
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly toastService: ToastService,
    private readonly gridLayoutService: GridLayoutService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      dateFrom: [''],
      dateTo: ['']
    });
  }

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedTx = null;

    const dateFrom = this.filterForm.get('dateFrom')?.value || undefined;
    const dateTo = this.filterForm.get('dateTo')?.value || undefined;

    this.stockTxService.getAll({ dateFrom, dateTo }).subscribe({
      next: (res) => {
        const data = this.applyClientFilters(res.data ?? []);
        this.rows = data;
        this.gridRows = data.map((row, index) => this.mapGridRow(row, index));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to load stock transactions');
        this.rows = [];
        this.gridRows = [];
        this.loading.set(false);
      }
    });
  }

  applyFilter(): void {
    this.loadTransactions();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      dateFrom: '',
      dateTo: ''
    });
    this.loadTransactions();
  }

  get selectedRecordText(): string {
    const list = this.gridRows;
    const item = this.selectedTx;
    if (!item) {
      return `Record 0 of ${list.length}`;
    }
    const idx = list.findIndex(r => r.id === item.id);
    return `Record ${idx + 1} of ${list.length}`;
  }

  goToCreate(): void {
    this.router.navigate(['/stock/transactions/create']);
  }

  goToEditSelected(): void {
    const item = this.selectedTx;
    if (item && item.id) {
      if (item.status === 'CONFIRM') {
        this.toastService.warning('Confirmed transactions cannot be edited');
        return;
      }
      this.router.navigate(['/stock/transactions/edit', item.id]);
    }
  }

  goToPreviewSelected(): void {
    const item = this.selectedTx;
    if (item && item.id) {
      this.router.navigate(['/stock/transactions/preview', item.id]);
    }
  }

  refreshList(): void {
    this.loadTransactions();
    this.toastService.success('Stock Transactions list refreshed successfully');
  }

  deleteSelected(): void {
    const item = this.selectedTx;
    if (!item || !item.id) {
      this.toastService.warning('Please select a stock transaction to delete');
      return;
    }

    if (confirm(`Are you sure you want to delete stock transaction ${item.stockNo}?`)) {
      this.stockTxService.remove(item.id).subscribe({
        next: () => {
          this.toastService.success('Stock Transaction deleted successfully');
          this.selectedTx = null;
          this.loadTransactions();
        },
        error: (err) => {
          console.error('Failed to delete stock transaction:', err);
          this.toastService.error('Failed to delete stock transaction: ' + (err.message || ''));
        }
      });
    }
  }

  onRowDoubleClicked(event: any): void {
    if (event.data && event.data.id) {
      if (event.data.status === 'CONFIRM') {
        this.router.navigate(['/stock/transactions/preview', event.data.id]);
      } else {
        this.router.navigate(['/stock/transactions/edit', event.data.id]);
      }
    }
  }

  onGridReady(event: GridReadyEvent<StockTransactionGridRow>): void {
    this.gridApi = event.api;
    const restored = this.gridLayoutService.restoreLayout(this.LAYOUT_KEY, this.gridApi);
    if (!restored) {
      this.gridApi.sizeColumnsToFit();
    }
  }

  saveLayout(): void {
    this.gridLayoutService.saveLayout(this.LAYOUT_KEY, this.gridApi);
    this.toastService.success('Layout saved successfully');
  }

  resetLayout(): void {
    this.gridLayoutService.resetLayout(this.LAYOUT_KEY, this.gridApi, this.columnDefs);
    this.toastService.success('Layout reset to default');
  }

  onSelectionChanged(event: SelectionChangedEvent<StockTransactionGridRow>): void {
    this.selectedTx = event.api.getSelectedRows()[0] ?? null;
  }

  private applyClientFilters(data: StockTransaction[]): StockTransaction[] {
    const search = String(this.filterForm.get('search')?.value ?? '').trim().toLowerCase();

    return data.filter((item) => {
      if (search && !this.matchesSearch(item, search)) {
        return false;
      }
      return true;
    });
  }

  private matchesSearch(item: StockTransaction, search: string): boolean {
    const values = [
      item.stockNo,
      item.stockType,
      item.transactionBy,
      item.reference,
      item.referenceType,
      item.status
    ];

    return values.some((value) => String(value ?? '').toLowerCase().includes(search));
  }

  private mapGridRow(row: StockTransaction, index: number): StockTransactionGridRow {
    return {
      ...row,
      srNo: index + 1,
      stockDateText: this.formatDate(row.date || ''),
      createdDateText: this.formatDateTime(row.createdAt),
      updatedDateText: this.formatDateTime(row.updatedAt)
    };
  }

  private formatDate(value: string): string {
    const date = this.parseDate(value);
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${date.getFullYear()}`;
  }

  private formatDateTime(value?: string): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    
    // Format: Jun 22 2026 12:33PM
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    return `${month} ${day} ${year} ${hours}:${minutes}${ampm}`;
  }

  private parseDate(value: string): Date | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const nativeDate = new Date(trimmed);
    if (!Number.isNaN(nativeDate.getTime())) return nativeDate;
    
    const match = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    if (!match) return null;
    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3]);
    const parsed = new Date(year, month, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
