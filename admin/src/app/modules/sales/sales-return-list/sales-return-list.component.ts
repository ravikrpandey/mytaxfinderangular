import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, SelectionChangedEvent, GridApi } from 'ag-grid-community';
import { SalesReturn, SalesReturnService } from '../services/sales-return.service';
import { ToastService } from '../../../services/toast.service';
import { ApiService } from '../../../services/api.service';
import { GridLayoutService } from '../../../services/grid-layout.service';

export interface SRGridRow extends SalesReturn {
  srNo: number;
  returnDateText: string;
  createdDateText: string;
  updatedDateText: string;
  createdBy: string;
  updatedBy: string;
}

@Component({
  selector: 'app-sales-return-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AgGridAngular, RouterModule],
  templateUrl: './sales-return-list.component.html',
  styleUrl: './sales-return-list.component.scss',
})
export class SalesReturnListComponent implements OnInit {
  filterForm: FormGroup;
  returns = signal<SalesReturn[]>([]);
  gridRows = signal<SRGridRow[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  selectedRow = signal<SRGridRow | null>(null);

  readonly rowSelection: 'single' = 'single';
  readonly overlayNoRowsTemplate = '<span class="sil-grid-empty">No Rows To Show</span>';
  private gridApi!: GridApi<SRGridRow>;
  readonly LAYOUT_KEY = 'sales_return_list';

  readonly defaultColDef: ColDef<SRGridRow> = {
    sortable: false,
    resizable: true,
  };

  readonly columnDefs: ColDef<SRGridRow>[] = [
    { headerName: 'RETURN NO.', field: 'returnNo', width: 140, minWidth: 120 },
    { headerName: 'STATUS', field: 'status', width: 100, minWidth: 90, valueFormatter: (p) => String(p.value ?? '').toUpperCase() },
    { headerName: 'RETURN DATE', field: 'returnDateText', width: 130, minWidth: 120 },
    { headerName: 'INVOICE NO.', field: 'salesInvoice', width: 140, minWidth: 120 },
    { headerName: 'CUSTOMER', field: 'customerName', width: 180, minWidth: 150 },
    {
      headerName: 'NET AMOUNT',
      field: 'subtotal',
      width: 120,
      minWidth: 100,
      cellClass: 'sil-cell-right',
      headerClass: 'sil-header-right',
      valueFormatter: (p) => (Number(p.value) || 0).toFixed(2),
    },
    {
      headerName: 'TAX AMOUNT',
      field: 'taxAmount',
      width: 120,
      minWidth: 100,
      cellClass: 'sil-cell-right',
      headerClass: 'sil-header-right',
      valueFormatter: (p) => (Number(p.value) || 0).toFixed(2),
    },
    {
      headerName: 'TOTAL AMOUNT',
      field: 'totalAmount',
      width: 120,
      minWidth: 100,
      cellClass: 'sil-cell-right',
      headerClass: 'sil-header-right',
      valueFormatter: (p) => (Number(p.value) || 0).toFixed(2),
    },
    { headerName: 'CREATED BY', field: 'createdBy', width: 120, minWidth: 100 },
    { headerName: 'CREATED DATE', field: 'createdDateText', width: 130, minWidth: 120 },
    { headerName: 'UPDATED BY', field: 'updatedBy', width: 120, minWidth: 100 },
    { headerName: 'UPDATED DATE', field: 'updatedDateText', width: 130, minWidth: 120 },
  ];

  constructor(
    private readonly router: Router,
    private readonly returnService: SalesReturnService,
    private readonly toastService: ToastService,
    private readonly fb: FormBuilder,
    private readonly gridLayoutService: GridLayoutService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      dateFrom: [''],
      dateTo: [''],
    });
  }

  ngOnInit(): void {
    this.loadReturns();
  }

  loadReturns(): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedRow.set(null);
    this.returnService.getAll().subscribe({
      next: (res) => {
        const data = res.data || [];
        this.returns.set(data);
        this.remapGridRows();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load sales returns:', err);
        this.error.set(err?.message ?? 'Failed to load sales returns');
        this.returns.set([]);
        this.gridRows.set([]);
        this.loading.set(false);
      },
    });
  }

  remapGridRows(): void {
    const list = this.applyFilters(this.returns());
    const mapped = list.map((r, i) => this.mapRow(r, i));
    this.gridRows.set(mapped);
  }

  applyFilter(): void {
    this.remapGridRows();
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', dateFrom: '', dateTo: '' });
    this.remapGridRows();
  }

  get totalSubtotal(): number {
    return this.gridRows().reduce((s, r) => s + (Number(r.subtotal) || 0), 0);
  }

  get totalTaxAmount(): number {
    return this.gridRows().reduce((s, r) => s + (Number(r.taxAmount) || 0), 0);
  }

  get totalAmount(): number {
    return this.gridRows().reduce((s, r) => s + (Number(r.totalAmount) || 0), 0);
  }

  selectedRecordText(): string {
    const item = this.selectedRow();
    const rows = this.gridRows();
    if (!item) return `Record 0 of ${rows.length}`;
    const idx = rows.findIndex((r) => r.id === item.id);
    return `Record ${idx + 1} of ${rows.length}`;
  }

  onCreateReturn(): void {
    this.router.navigate(['/sales/return/create']);
  }

  onEditSelected(): void {
    const row = this.selectedRow();
    if (row?.id) {
      this.router.navigate([`/sales/return/edit/${row.id}`]);
    }
  }

  onPreviewSelected(): void {
    const row = this.selectedRow();
    if (row?.id) {
      this.router.navigate([`/sales/return/preview/${row.id}`]);
    }
  }

  refreshList(): void {
    this.loadReturns();
    this.toastService.success('Sales return list refreshed');
  }

  deleteSelected(): void {
    const row = this.selectedRow();
    if (!row?.id) {
      this.toastService.warning('Please select a record to delete');
      return;
    }
    if (confirm(`Are you sure you want to delete Sales Return ${row.returnNo}?`)) {
      this.returnService.remove(row.id).subscribe({
        next: () => {
          this.toastService.success('Sales Return deleted successfully');
          this.selectedRow.set(null);
          this.loadReturns();
        },
        error: (err) => {
          console.error('Failed to delete sales return:', err);
          this.toastService.error('Failed to delete: ' + (err.message || ''));
        },
      });
    }
  }

  onExportCsv(): void {
    const rows = this.gridRows();
    if (rows.length === 0) {
      this.toastService.warning('No data to export');
      return;
    }
    const headers = [
      'SR NO',
      'RETURN NO',
      'STATUS',
      'RETURN DATE',
      'INVOICE NO',
      'CUSTOMER',
      'NET AMOUNT',
      'TAX AMOUNT',
      'TOTAL AMOUNT',
      'CREATED BY',
      'CREATED DATE',
    ];
    const csvContent = rows.map((r) => [
      r.srNo,
      `"${r.returnNo}"`,
      `"${r.status}"`,
      `"${r.returnDateText}"`,
      `"${r.salesInvoice || ''}"`,
      `"${r.customerName}"`,
      r.subtotal,
      r.taxAmount,
      r.totalAmount,
      `"${r.createdBy}"`,
      `"${r.createdDateText}"`,
    ]);
    const csv = [headers.join(','), ...csvContent.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_returns_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.toastService.success('Exported successfully');
  }

  onRowDoubleClicked(event: any): void {
    if (event.data?.id) {
      this.router.navigate([`/sales/return/edit/${event.data.id}`]);
    }
  }

  onGridReady(event: GridReadyEvent<SRGridRow>): void {
    this.gridApi = event.api;
    this.gridLayoutService.restoreLayout(this.LAYOUT_KEY, this.gridApi);
  }

  onSaveLayout(): void {
    this.gridLayoutService.saveLayout(this.LAYOUT_KEY, this.gridApi);
    this.toastService.success('Layout saved');
  }

  onResetLayout(): void {
    this.gridLayoutService.resetLayout(this.LAYOUT_KEY, this.gridApi, this.columnDefs);
    this.toastService.success('Layout reset');
  }

  onSelectionChanged(event: SelectionChangedEvent<SRGridRow>): void {
    this.selectedRow.set(event.api.getSelectedRows()[0] ?? null);
  }

  private applyFilters(data: SalesReturn[]): SalesReturn[] {
    const search = String(this.filterForm.get('search')?.value ?? '').trim().toLowerCase();
    const from = this.parseDateMs(this.filterForm.get('dateFrom')?.value ?? '');
    const to = this.parseDateMs(this.filterForm.get('dateTo')?.value ?? '', true);

    return data.filter((item) => {
      if (search) {
        const matchesSearch = [
          'returnNo',
          'customerName',
          'salesInvoice',
          'status',
        ].some((key) => String((item as any)[key] ?? '').toLowerCase().includes(search));

        if (!matchesSearch) return false;
      }

      const d = this.parseDateMs(item.returnDate || '');
      if (from !== null && (d === null || d < from)) return false;
      if (to !== null && (d === null || d > to)) return false;

      return true;
    });
  }

  private parseDateMs(value: string, endOfDay = false): number | null {
    if (!value?.trim()) return null;
    const d = new Date(value.trim());
    if (isNaN(d.getTime())) return null;
    if (endOfDay) {
      d.setHours(23, 59, 59, 999);
    } else {
      d.setHours(0, 0, 0, 0);
    }
    return d.getTime();
  }

  private formatDate(value: any): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  private mapRow(r: SalesReturn, i: number): SRGridRow {
    return {
      ...r,
      srNo: i + 1,
      returnDateText: this.formatDate(r.returnDate),
      createdDateText: this.formatDate(r.createdAt),
      updatedDateText: this.formatDate(r.updatedAt),
      createdBy: 'ADMIN',
      updatedBy: 'ADMIN',
    };
  }
}
