import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, SelectionChangedEvent, GridApi } from 'ag-grid-community';
import { Receipt, ReceiptService } from '../services/receipt.service';
import { ToastService } from '../../../services/toast.service';
import { GridLayoutService } from '../../../services/grid-layout.service';

export interface RCGridRow extends Receipt {
  srNo: number;
  receiptDateText: string;
}

@Component({
  selector: 'app-receipt-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AgGridAngular, RouterModule],
  templateUrl: './receipt-list.component.html',
  styleUrl: './receipt-list.component.scss',
})
export class ReceiptListComponent implements OnInit {
  filterForm: FormGroup;
  receipts = signal<Receipt[]>([]);
  gridRows = signal<RCGridRow[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  selectedRow = signal<RCGridRow | null>(null);

  readonly rowSelection: 'single' = 'single';
  readonly overlayNoRowsTemplate = '<span class="rcl-grid-empty">No Rows To Show</span>';
  private gridApi!: GridApi<RCGridRow>;
  readonly LAYOUT_KEY = 'receipt_list';

  readonly defaultColDef: ColDef<RCGridRow> = {
    sortable: false,
    resizable: true,
  };

  readonly columnDefs: ColDef<RCGridRow>[] = [
    { headerName: 'SR NO', field: 'srNo', width: 80, minWidth: 70, maxWidth: 90, pinned: 'left' },
    { headerName: 'RECEIPT NO.', field: 'receiptNo', width: 160, minWidth: 140 },
    { headerName: 'RECEIPT DATE', field: 'receiptDateText', width: 140, minWidth: 130 },
    { headerName: 'CUSTOMER', field: 'customerName', width: 240, minWidth: 180 },
    { headerName: 'PAYMENT MODE', field: 'paymentMode', width: 140, minWidth: 120 },
    { headerName: 'REFERENCE NO.', field: 'referenceNo', width: 160, minWidth: 140 },
    {
      headerName: 'AMOUNT',
      field: 'amount',
      width: 140,
      minWidth: 120,
      cellClass: 'rcl-cell-right',
      headerClass: 'rcl-header-right',
      valueFormatter: (p) => (Number(p.value) || 0).toFixed(2),
    },
    { headerName: 'NOTES', field: 'notes', width: 240, minWidth: 180 },
  ];

  constructor(
    private readonly router: Router,
    private readonly receiptService: ReceiptService,
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
    this.loadReceipts();
  }

  loadReceipts(): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedRow.set(null);
    this.receiptService.getAll().subscribe({
      next: (res) => {
        const data = res.data || [];
        this.receipts.set(data);
        this.remapGridRows();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load receipts:', err);
        this.error.set(err?.message ?? 'Failed to load receipts');
        this.receipts.set([]);
        this.gridRows.set([]);
        this.loading.set(false);
      },
    });
  }

  remapGridRows(): void {
    const list = this.applyFilters(this.receipts());
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

  onCreateReceipt(): void {
    this.router.navigate(['/receipt/create']);
  }

  onEditSelected(): void {
    const row = this.selectedRow();
    if (row?.id) {
      this.router.navigate([`/receipt/edit/${row.id}`]);
    }
  }

  onPreviewSelected(): void {
    const row = this.selectedRow();
    if (row?.id) {
      this.router.navigate([`/receipt/preview/${row.id}`]);
    }
  }

  refreshList(): void {
    this.loadReceipts();
    this.toastService.success('Receipt list refreshed');
  }

  deleteSelected(): void {
    const row = this.selectedRow();
    if (!row?.id) {
      this.toastService.warning('Please select a record to delete');
      return;
    }
    if (confirm(`Are you sure you want to delete Receipt ${row.receiptNo}?`)) {
      this.receiptService.remove(row.id).subscribe({
        next: () => {
          this.toastService.success('Receipt deleted successfully');
          this.selectedRow.set(null);
          this.loadReceipts();
        },
        error: (err) => {
          console.error('Failed to delete receipt:', err);
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
      'RECEIPT NO',
      'RECEIPT DATE',
      'CUSTOMER',
      'PAYMENT MODE',
      'REFERENCE NO',
      'AMOUNT',
      'NOTES',
    ];
    const csvContent = rows.map((r) => [
      r.srNo,
      `"${r.receiptNo}"`,
      `"${r.receiptDateText}"`,
      `"${r.customerName}"`,
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
    a.download = `customer_receipts_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.toastService.success('Exported successfully');
  }

  onRowDoubleClicked(event: any): void {
    if (event.data?.id) {
      this.router.navigate([`/receipt/edit/${event.data.id}`]);
    }
  }

  onGridReady(event: GridReadyEvent<RCGridRow>): void {
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

  onSelectionChanged(event: SelectionChangedEvent<RCGridRow>): void {
    this.selectedRow.set(event.api.getSelectedRows()[0] ?? null);
  }

  private applyFilters(data: Receipt[]): Receipt[] {
    const search = String(this.filterForm.get('search')?.value ?? '').trim().toLowerCase();
    const from = this.parseDateMs(this.filterForm.get('dateFrom')?.value ?? '');
    const to = this.parseDateMs(this.filterForm.get('dateTo')?.value ?? '', true);

    return data.filter((item) => {
      if (search) {
        const matchesSearch = [
          'receiptNo',
          'customerName',
          'referenceNo',
          'paymentMode',
          'notes',
        ].some((key) => String((item as any)[key] ?? '').toLowerCase().includes(search));

        if (!matchesSearch) return false;
      }

      const d = this.parseDateMs(item.receiptDate || '');
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

  private mapRow(r: Receipt, i: number): RCGridRow {
    return {
      ...r,
      srNo: i + 1,
      receiptDateText: this.formatDate(r.receiptDate || ''),
    };
  }
}
