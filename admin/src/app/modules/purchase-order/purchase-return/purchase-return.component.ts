import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, SelectionChangedEvent, ValueFormatterParams, GridApi } from 'ag-grid-community';
import { PurchaseReturnService, PurchaseReturn } from '../services/purchase-return.service';
import { ToastService } from '../../../services/toast.service';
import { GridLayoutService } from '../../../services/grid-layout.service';

interface PurchaseReturnGridRow extends PurchaseReturn {
  srNo: number;
  statusText: string;
  returnNoText: string;
  returnDateText: string;
  supplierText: string;
  purchaseInvoiceText: string;
  netAmountValue: number;
  taxAmountValue: number;
  totalAmountValue: number;
}

@Component({
  selector: 'app-purchase-return',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AgGridAngular, RouterModule],
  templateUrl: './purchase-return.component.html',
  styleUrl: './purchase-return.component.scss'
})
export class PurchaseReturnComponent implements OnInit {
  filterForm: FormGroup;
  rows: PurchaseReturn[] = [];
  gridRows: PurchaseReturnGridRow[] = [];
  loading = signal(true);
  error = signal<string | null>(null);
  selectedReturn: PurchaseReturnGridRow | null = null;

  readonly rowSelection: 'single' = 'single';
  readonly overlayNoRowsTemplate = '<span class="pr-grid-empty">No Rows To Show</span>';
  private gridApi!: GridApi<PurchaseReturnGridRow>;
  readonly LAYOUT_KEY = 'purchase_return_list';
  
  readonly defaultColDef: ColDef<PurchaseReturnGridRow> = {
    sortable: false,
    resizable: true
  };

  readonly columnDefs: ColDef<PurchaseReturnGridRow>[] = [
    {
      headerName: 'SR NO',
      field: 'srNo',
      width: 90,
      minWidth: 90,
      maxWidth: 100,
      pinned: 'left'
    },
    {
      headerName: 'STATUS',
      field: 'statusText',
      width: 140,
      minWidth: 130,
      valueFormatter: (params) => params.value ?? ''
    },
    {
      headerName: 'RETURN NO',
      field: 'returnNoText',
      width: 150,
      minWidth: 140
    },
    {
      headerName: 'RETURN DATE',
      field: 'returnDateText',
      width: 140,
      minWidth: 130
    },
    {
      headerName: 'SUPPLIER',
      field: 'supplierText',
      width: 180,
      minWidth: 170
    },
    {
      headerName: 'PURCHASE INVOICE',
      field: 'purchaseInvoiceText',
      width: 150,
      minWidth: 140
    },
    {
      headerName: 'NET AMOUNT',
      field: 'netAmountValue',
      width: 140,
      minWidth: 135,
      cellClass: 'pr-cell-right',
      headerClass: 'pr-header-right',
      valueFormatter: (params) => this.formatAmountValue(params)
    },
    {
      headerName: 'TAX AMOUNT',
      field: 'taxAmountValue',
      width: 140,
      minWidth: 135,
      cellClass: 'pr-cell-right',
      headerClass: 'pr-header-right',
      valueFormatter: (params) => this.formatAmountValue(params)
    },
    {
      headerName: 'TOTAL AMOUNT',
      field: 'totalAmountValue',
      width: 150,
      minWidth: 145,
      cellClass: 'pr-cell-right',
      headerClass: 'pr-header-right',
      valueFormatter: (params) => this.formatAmountValue(params)
    }
  ];

  constructor(
    private readonly purchaseReturnService: PurchaseReturnService,
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
    this.loadReturns();
  }

  loadReturns(): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedReturn = null;
    this.purchaseReturnService.getAll().subscribe({
      next: (res: any) => {
        const data = this.applyClientFilters(res.data ?? []);
        this.rows = data;
        this.gridRows = data.map((row, index) => this.mapGridRow(row, index));
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err?.message ?? 'Failed to load purchase returns');
        this.rows = [];
        this.gridRows = [];
        this.loading.set(false);
      }
    });
  }

  applyFilter(): void {
    this.loadReturns();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      dateFrom: '',
      dateTo: ''
    });
    this.loadReturns();
  }

  get totalNetAmount(): number {
    return this.rows.reduce((sum, row) => sum + (Number(row.subtotal) || 0), 0);
  }

  get totalTaxAmount(): number {
    return this.rows.reduce((sum, row) => sum + (Number(row.taxAmount) || 0), 0);
  }

  get totalAmount(): number {
    return this.rows.reduce((sum, row) => sum + (Number(row.totalAmount) || 0), 0);
  }

  get selectedRecordText(): string {
    const list = this.gridRows;
    const item = this.selectedReturn;
    if (!item) {
      return `Record 0 of ${list.length}`;
    }
    const idx = list.findIndex(r => r.id === item.id);
    return `Record ${idx + 1} of ${list.length}`;
  }

  goToCreate(): void {
    this.router.navigate(['/po/return/create']);
  }

  goToEditSelected(): void {
    const item = this.selectedReturn;
    if (item && item.id) {
      this.router.navigate(['/po/return/edit', item.id]);
    }
  }

  goToPreviewSelected(): void {
    const item = this.selectedReturn;
    if (item && item.id) {
      this.router.navigate(['/po/return/preview', item.id]);
    }
  }

  refreshList(): void {
    this.loadReturns();
    this.toastService.success('Purchase Return list refreshed successfully');
  }

  deleteSelected(): void {
    const item = this.selectedReturn;
    if (!item || !item.id) {
      this.toastService.warning('Please select a purchase return to delete');
      return;
    }

    if (confirm(`Are you sure you want to delete purchase return ${item.returnNoText}?`)) {
      this.purchaseReturnService.remove(item.id).subscribe({
        next: () => {
          this.toastService.success('Purchase Return deleted successfully');
          this.selectedReturn = null;
          this.loadReturns();
        },
        error: (err: any) => {
          console.error('Failed to delete purchase return:', err);
          this.toastService.error('Failed to delete purchase return: ' + (err.message || ''));
        }
      });
    }
  }

  exportToCSV(): void {
    const data = this.rows;
    if (data.length === 0) {
      this.toastService.warning('No data available to export');
      return;
    }

    const headers = ['SR NO', 'STATUS', 'RETURN NO', 'RETURN DATE', 'SUPPLIER', 'PURCHASE INVOICE', 'NET AMOUNT', 'TAX AMOUNT', 'TOTAL AMOUNT'];
    const rows = this.gridRows.map(row => [
      row.srNo,
      `"${row.statusText}"`,
      `"${row.returnNoText}"`,
      `"${row.returnDateText}"`,
      `"${row.supplierText}"`,
      `"${row.purchaseInvoiceText}"`,
      row.netAmountValue,
      row.taxAmountValue,
      row.totalAmountValue
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'purchase_returns_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toastService.success('Purchase returns exported to CSV successfully');
  }

  onRowDoubleClicked(event: any): void {
    if (event.data && event.data.id) {
      this.router.navigate(['/po/return/edit', event.data.id]);
    }
  }

  onGridReady(event: GridReadyEvent<PurchaseReturnGridRow>): void {
    this.gridApi = event.api;
    const restored = this.gridLayoutService.restoreLayout(this.LAYOUT_KEY, this.gridApi);
    if (!restored) { this.gridApi.sizeColumnsToFit(); }
  }

  saveLayout(): void {
    this.gridLayoutService.saveLayout(this.LAYOUT_KEY, this.gridApi);
    this.toastService.success('Layout saved successfully');
  }

  resetLayout(): void {
    this.gridLayoutService.resetLayout(this.LAYOUT_KEY, this.gridApi, this.columnDefs);
    this.toastService.success('Layout reset to default');
  }

  onSelectionChanged(event: SelectionChangedEvent<PurchaseReturnGridRow>): void {
    this.selectedReturn = event.api.getSelectedRows()[0] ?? null;
  }

  formatAmount(value: number): string {
    return value.toFixed(2);
  }

  private formatAmountValue(params: ValueFormatterParams<PurchaseReturnGridRow, number>): string {
    return this.formatAmount(Number(params.value) || 0);
  }

  private applyClientFilters(data: PurchaseReturn[]): PurchaseReturn[] {
    const search = String(this.filterForm.get('search')?.value ?? '').trim().toLowerCase();
    const fromDate = this.parseFilterDate(String(this.filterForm.get('dateFrom')?.value ?? ''));
    const toDate = this.parseFilterDate(String(this.filterForm.get('dateTo')?.value ?? ''), true);

    return data.filter((item) => {
      if (search && !this.matchesSearch(item, search)) {
        return false;
      }

      const orderDate = this.parseDate(item.returnDate || '');
      const orderTime = orderDate?.getTime() ?? null;

      if (fromDate !== null && (orderTime === null || orderTime < fromDate)) {
        return false;
      }

      if (toDate !== null && (orderTime === null || orderTime > toDate)) {
        return false;
      }

      return true;
    });
  }

  private matchesSearch(item: PurchaseReturn, search: string): boolean {
    const values = [
      item.returnNo,
      item.vendorName,
      item.purchaseInvoice,
      item.supplierReference
    ];

    return values.some((value) => String(value ?? '').toLowerCase().includes(search));
  }

  private mapGridRow(row: PurchaseReturn, index: number): PurchaseReturnGridRow {
    return {
      ...row,
      srNo: index + 1,
      statusText: String(row.status ?? 'draft').toUpperCase(),
      returnNoText: row.returnNo || '',
      returnDateText: this.formatDate(row.returnDate || ''),
      supplierText: row.vendorName || '',
      purchaseInvoiceText: row.purchaseInvoice || '-',
      netAmountValue: Number(row.subtotal) || 0,
      taxAmountValue: Number(row.taxAmount) || 0,
      totalAmountValue: Number(row.totalAmount) || 0
    };
  }

  private formatDate(value: string): string {
    const date = this.parseDate(value);
    if (!date) {
      return '';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private parseFilterDate(value: string, endOfDay = false): number | null {
    const date = this.parseDate(value);
    if (!date) {
      return null;
    }

    if (endOfDay) {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }

    return date.getTime();
  }

  private parseDate(value: string): Date | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const nativeDate = new Date(trimmed);
    if (!Number.isNaN(nativeDate.getTime())) {
      return nativeDate;
    }

    const match = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    if (!match) {
      return null;
    }

    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3]);
    const parsed = new Date(year, month, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
