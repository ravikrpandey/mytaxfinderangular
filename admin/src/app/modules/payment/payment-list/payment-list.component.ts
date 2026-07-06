import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, SelectionChangedEvent, GridApi } from 'ag-grid-community';
import { Payment, PaymentService } from '../services/payment.service';
import { ToastService } from '../../../services/toast.service';
import { GridLayoutService } from '../../../services/grid-layout.service';

export interface PMGridRow extends Payment {
  srNo: number;
  paymentDateText: string;
  paymentTypeText: string;
}

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AgGridAngular, RouterModule],
  templateUrl: './payment-list.component.html',
  styleUrl: './payment-list.component.scss',
})
export class PaymentListComponent implements OnInit {
  filterForm: FormGroup;
  payments = signal<Payment[]>([]);
  gridRows = signal<PMGridRow[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  selectedRow = signal<PMGridRow | null>(null);

  readonly rowSelection: 'single' = 'single';
  readonly overlayNoRowsTemplate = '<span class="pcl-grid-empty">No Rows To Show</span>';
  private gridApi!: GridApi<PMGridRow>;
  readonly LAYOUT_KEY = 'payment_list';

  readonly defaultColDef: ColDef<PMGridRow> = {
    sortable: false,
    resizable: true,
  };

  readonly columnDefs: ColDef<PMGridRow>[] = [
    { headerName: 'SR NO', field: 'srNo', width: 80, minWidth: 70, maxWidth: 90, pinned: 'left' },
    { headerName: 'PAYMENT NO.', field: 'paymentNo', width: 160, minWidth: 140 },
    { headerName: 'PAYMENT DATE', field: 'paymentDateText', width: 140, minWidth: 130 },
    { headerName: 'TYPE', field: 'paymentTypeText', width: 150, minWidth: 130 },
    { headerName: 'VENDOR', field: 'vendorName', width: 220, minWidth: 160, valueFormatter: (p) => p.value || '-' },
    { headerName: 'CATEGORY', field: 'expenseCategory', width: 180, minWidth: 140, valueFormatter: (p) => p.value || '-' },
    { headerName: 'PAYMENT MODE', field: 'paymentMode', width: 140, minWidth: 120 },
    { headerName: 'REFERENCE NO.', field: 'referenceNo', width: 160, minWidth: 140, valueFormatter: (p) => p.value || '-' },
    {
      headerName: 'AMOUNT',
      field: 'amount',
      width: 140,
      minWidth: 120,
      cellClass: 'pcl-cell-right',
      headerClass: 'pcl-header-right',
      valueFormatter: (p) => (Number(p.value) || 0).toFixed(2),
    },
    { headerName: 'NOTES', field: 'notes', width: 240, minWidth: 180, valueFormatter: (p) => p.value || '-' },
  ];

  constructor(
    private readonly router: Router,
    private readonly paymentService: PaymentService,
    private readonly toastService: ToastService,
    private readonly fb: FormBuilder,
    private readonly gridLayoutService: GridLayoutService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      dateFrom: [''],
      dateTo: [''],
      paymentType: [''],
    });
  }

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedRow.set(null);
    this.paymentService.getAll().subscribe({
      next: (res) => {
        const data = res.data || [];
        this.payments.set(data);
        this.remapGridRows();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load payments:', err);
        this.error.set(err?.message ?? 'Failed to load payments');
        this.payments.set([]);
        this.gridRows.set([]);
        this.loading.set(false);
      },
    });
  }

  remapGridRows(): void {
    const list = this.applyFilters(this.payments());
    const mapped = list.map((r, i) => this.mapRow(r, i));
    this.gridRows.set(mapped);
  }

  applyFilter(): void {
    this.remapGridRows();
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', dateFrom: '', dateTo: '', paymentType: '' });
    this.remapGridRows();
  }

  get totalAmount(): number {
    return this.gridRows().reduce((s, r) => s + (Number(r.amount) || 0), 0);
  }

  selectedRecordText(): string {
    const item = this.selectedRow();
    const rows = this.gridRows();
    if (!item) return `Record 0 of ${rows.length}`;
    const idx = rows.findIndex((r) => r.id === item.id);
    return `Record ${idx + 1} of ${rows.length}`;
  }

  onCreatePayment(): void {
    this.router.navigate(['/payment/create']);
  }

  onEditSelected(): void {
    const row = this.selectedRow();
    if (row?.id) {
      this.router.navigate([`/payment/edit/${row.id}`]);
    }
  }

  onPreviewSelected(): void {
    const row = this.selectedRow();
    if (row?.id) {
      this.router.navigate([`/payment/preview/${row.id}`]);
    }
  }

  refreshList(): void {
    this.loadPayments();
    this.toastService.success('Payment list refreshed');
  }

  deleteSelected(): void {
    const row = this.selectedRow();
    if (!row?.id) {
      this.toastService.warning('Please select a record to delete');
      return;
    }
    if (confirm(`Are you sure you want to delete Payment Voucher ${row.paymentNo}?`)) {
      this.paymentService.remove(row.id).subscribe({
        next: () => {
          this.toastService.success('Payment deleted successfully');
          this.selectedRow.set(null);
          this.loadPayments();
        },
        error: (err) => {
          console.error('Failed to delete payment:', err);
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
      'PAYMENT NO',
      'PAYMENT DATE',
      'TYPE',
      'VENDOR',
      'CATEGORY',
      'PAYMENT MODE',
      'REFERENCE NO',
      'AMOUNT',
      'NOTES',
    ];
    const csvContent = rows.map((r) => [
      r.srNo,
      `"${r.paymentNo}"`,
      `"${r.paymentDateText}"`,
      `"${r.paymentTypeText}"`,
      `"${r.vendorName || '-'}"`,
      `"${r.expenseCategory || '-'}"`,
      `"${r.paymentMode}"`,
      `"${r.referenceNo || ''}"`,
      r.amount,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...csvContent.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_expenses_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.toastService.success('Exported successfully');
  }

  onRowDoubleClicked(event: any): void {
    if (event.data?.id) {
      this.router.navigate([`/payment/edit/${event.data.id}`]);
    }
  }

  onGridReady(event: GridReadyEvent<PMGridRow>): void {
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

  onSelectionChanged(event: SelectionChangedEvent<PMGridRow>): void {
    this.selectedRow.set(event.api.getSelectedRows()[0] ?? null);
  }

  private applyFilters(data: Payment[]): Payment[] {
    const search = String(this.filterForm.get('search')?.value ?? '').trim().toLowerCase();
    const from = this.parseDateMs(this.filterForm.get('dateFrom')?.value ?? '');
    const to = this.parseDateMs(this.filterForm.get('dateTo')?.value ?? '', true);
    const type = this.filterForm.get('paymentType')?.value;

    return data.filter((item) => {
      if (type && item.paymentType !== type) return false;

      if (search) {
        const matchesSearch = [
          'paymentNo',
          'vendorName',
          'expenseCategory',
          'referenceNo',
          'paymentMode',
          'notes',
        ].some((key) => String((item as any)[key] ?? '').toLowerCase().includes(search));

        if (!matchesSearch) return false;
      }

      const d = this.parseDateMs(item.paymentDate || '');
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

  private formatDate(value: string): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  private mapRow(r: Payment, i: number): PMGridRow {
    return {
      ...r,
      srNo: i + 1,
      paymentDateText: this.formatDate(r.paymentDate || ''),
      paymentTypeText: r.paymentType === 'direct_expense' ? 'Direct Expense' : 'Vendor Payment',
    };
  }
}
