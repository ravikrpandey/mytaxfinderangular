import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, SelectionChangedEvent, GridApi } from 'ag-grid-community';
import { SalesInvoice, SalesInvoiceService } from '../services/sales-invoice.service';
import { ToastService } from '../../../services/toast.service';
import { ApiService } from '../../../services/api.service';
import { GridLayoutService } from '../../../services/grid-layout.service';

export interface SIGridRow extends SalesInvoice {
  srNo: number;
  invoiceDateText: string;
  dueDateText: string;
  orderDateText: string;
  pickingDateText: string;
  customerCode: string;
  totalQuantity: number;
  totalAmountValue: number;
}

interface CustomerLookup {
  id: number;
  name: string;
  code: string;
  phone: string;
}

@Component({
  selector: 'app-sales-invoice-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AgGridAngular, RouterModule],
  templateUrl: './sales-invoice-list.component.html',
  styleUrl: './sales-invoice-list.component.scss',
})
export class SalesInvoiceListComponent implements OnInit {
  filterForm: FormGroup;
  invoices = signal<SalesInvoice[]>([]);
  gridRows = signal<SIGridRow[]>([]);
  customers = signal<CustomerLookup[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  selectedRow = signal<SIGridRow | null>(null);

  readonly rowSelection: 'single' = 'single';
  readonly overlayNoRowsTemplate = '<span class="sil-grid-empty">No Rows To Show</span>';
  private gridApi!: GridApi<SIGridRow>;
  readonly LAYOUT_KEY = 'sales_invoice_list';

  readonly defaultColDef: ColDef<SIGridRow> = {
    sortable: false,
    resizable: true,
  };

  readonly columnDefs: ColDef<SIGridRow>[] = [
    { headerName: 'SR NO', field: 'srNo', width: 80, minWidth: 70, maxWidth: 90, pinned: 'left' },
    { headerName: 'INVOICE NO.', field: 'invoiceNo', width: 160, minWidth: 140 },
    { headerName: 'INVOICE DATE', field: 'invoiceDateText', width: 140, minWidth: 130 },
    { headerName: 'STATUS', field: 'status', width: 120, minWidth: 110, valueFormatter: (p) => String(p.value ?? '').toUpperCase() },
    { headerName: 'PICKING NO.', field: 'pickingNo', width: 150, minWidth: 130 },
    { headerName: 'PICKING DATE', field: 'pickingDateText', width: 140, minWidth: 130 },
    { headerName: 'ORDER NO.', field: 'orderNo', width: 150, minWidth: 130 },
    { headerName: 'ORDER DATE', field: 'orderDateText', width: 140, minWidth: 130 },
    { headerName: 'CODE', field: 'customerCode', width: 120, minWidth: 100 },
    { headerName: 'CUSTOMER', field: 'customerName', width: 200, minWidth: 160 },
    { headerName: 'ADDRESS', field: 'billingAddress', width: 240, minWidth: 180 },
    { headerName: 'DELIVERY ADDRESS', field: 'deliveryAddress', width: 240, minWidth: 180 },
    {
      headerName: 'TOTAL QUANTITY',
      field: 'totalQuantity',
      width: 140,
      minWidth: 120,
      cellClass: 'sil-cell-right',
      headerClass: 'sil-header-right',
      valueFormatter: (p) => (Number(p.value) || 0).toFixed(2),
    },
  ];

  constructor(
    private readonly router: Router,
    private readonly invoiceService: SalesInvoiceService,
    private readonly toastService: ToastService,
    private readonly apiService: ApiService,
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
    this.loadCustomers();
    this.loadInvoices();
  }

  loadCustomers(): void {
    this.apiService.getOrganisations().subscribe({
      next: (res) => {
        if (res && res.data) {
          const mapped = res.data.map((item: any) => ({
            id: item.id,
            name: item.customer_name,
            code: item.customer_code,
            phone: item.phone_number || '',
          }));
          this.customers.set(mapped);
          this.remapGridRows();
        }
      },
      error: (err) => {
        console.error('Failed to load customer organizations:', err);
      }
    });
  }

  loadInvoices(): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedRow.set(null);
    this.invoiceService.getAll().subscribe({
      next: (res) => {
        const data = res.data || [];
        this.invoices.set(data);
        this.remapGridRows();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load sales invoices:', err);
        this.error.set(err?.message ?? 'Failed to load sales invoices');
        this.invoices.set([]);
        this.gridRows.set([]);
        this.loading.set(false);
      },
    });
  }

  remapGridRows(): void {
    const list = this.applyFilters(this.invoices());
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
    return this.gridRows().reduce((s, r) => s + (Number(r.totalAmount) || 0), 0);
  }

  selectedRecordText(): string {
    const item = this.selectedRow();
    const rows = this.gridRows();
    if (!item) return `Record 0 of ${rows.length}`;
    const idx = rows.findIndex((r) => r.id === item.id);
    return `Record ${idx + 1} of ${rows.length}`;
  }

  onCreateInvoice(): void {
    this.router.navigate(['/sales/sales-invoice/create']);
  }

  onEditSelected(): void {
    const row = this.selectedRow();
    if (row?.id) {
      this.router.navigate([`/sales/sales-invoice/edit/${row.id}`]);
    }
  }

  onPreviewSelected(): void {
    const row = this.selectedRow();
    if (row?.id) {
      this.router.navigate([`/sales/sales-invoice/preview/${row.id}`]);
    }
  }

  refreshList(): void {
    this.loadInvoices();
    this.toastService.success('Sales invoice list refreshed');
  }

  deleteSelected(): void {
    const row = this.selectedRow();
    if (!row?.id) {
      this.toastService.warning('Please select a record to delete');
      return;
    }
    if (confirm(`Are you sure you want to delete Sales Invoice ${row.invoiceNo}?`)) {
      this.invoiceService.remove(row.id).subscribe({
        next: () => {
          this.toastService.success('Sales Invoice deleted successfully');
          this.selectedRow.set(null);
          this.loadInvoices();
        },
        error: (err) => {
          console.error('Failed to delete sales invoice:', err);
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
      'INVOICE NO',
      'INVOICE DATE',
      'STATUS',
      'PICKING NO',
      'PICKING DATE',
      'ORDER NO',
      'ORDER DATE',
      'CODE',
      'CUSTOMER',
      'ADDRESS',
      'DELIVERY ADDRESS',
      'TOTAL QUANTITY',
    ];
    const csvContent = rows.map((r) => [
      r.srNo,
      `"${r.invoiceNo}"`,
      `"${r.invoiceDateText}"`,
      `"${r.status}"`,
      `"${r.pickingNo || ''}"`,
      `"${r.pickingDateText || ''}"`,
      `"${r.orderNo || ''}"`,
      `"${r.orderDateText || ''}"`,
      `"${r.customerCode || ''}"`,
      `"${r.customerName}"`,
      `"${(r.billingAddress || '').replace(/"/g, '""')}"`,
      `"${(r.deliveryAddress || '').replace(/"/g, '""')}"`,
      r.totalQuantity,
    ]);
    const csv = [headers.join(','), ...csvContent.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_invoices_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.toastService.success('Exported successfully');
  }

  onRowDoubleClicked(event: any): void {
    if (event.data?.id) {
      this.router.navigate([`/sales/sales-invoice/edit/${event.data.id}`]);
    }
  }

  onGridReady(event: GridReadyEvent<SIGridRow>): void {
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

  onSelectionChanged(event: SelectionChangedEvent<SIGridRow>): void {
    this.selectedRow.set(event.api.getSelectedRows()[0] ?? null);
  }

  private applyFilters(data: SalesInvoice[]): SalesInvoice[] {
    const search = String(this.filterForm.get('search')?.value ?? '').trim().toLowerCase();
    const from = this.parseDateMs(this.filterForm.get('dateFrom')?.value ?? '');
    const to = this.parseDateMs(this.filterForm.get('dateTo')?.value ?? '', true);

    return data.filter((item) => {
      if (search) {
        const matchesSearch = [
          'invoiceNo',
          'customerName',
          'pickingNo',
          'orderNo',
          'status',
        ].some((key) => String((item as any)[key] ?? '').toLowerCase().includes(search));

        if (!matchesSearch) return false;
      }

      const d = this.parseDateMs(item.invoiceDate || '');
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

  private mapRow(r: SalesInvoice, i: number): SIGridRow {
    const customer = this.customers().find((c) => c.id === r.customerId);
    const totalQty = r.items ? r.items.reduce((sum, item) => sum + (Number(item.invoiceQty) || 0), 0) : 0;
    return {
      ...r,
      srNo: i + 1,
      invoiceDateText: this.formatDate(r.invoiceDate || ''),
      dueDateText: this.formatDate(r.dueDate || ''),
      orderDateText: this.formatDate(r.orderDate || ''),
      pickingDateText: this.formatDate(r.invoiceDate || ''), // picking date defaults to invoice date as displayed in the image
      customerCode: customer ? customer.code : '',
      totalQuantity: totalQty,
      totalAmountValue: Number(r.totalAmount) || 0,
    };
  }
}
