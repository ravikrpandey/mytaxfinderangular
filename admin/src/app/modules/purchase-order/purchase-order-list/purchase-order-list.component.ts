import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, SelectionChangedEvent, ValueFormatterParams, GridApi } from 'ag-grid-community';
import { PurchaseOrderService, PurchaseOrder, PurchaseOrderStatus } from '../services/purchase-order.service';
import { ToastService } from '../../../services/toast.service';
import { GridLayoutService } from '../../../services/grid-layout.service';

interface PurchaseOrderGridRow extends PurchaseOrder {
  srNo: number;
  statusText: string;
  orderNoText: string;
  orderDateText: string;
  supplierOrderText: string;
  supplierText: string;
  currencyText: string;
  netAmountValue: number;
  taxAmountValue: number;
  totalAmountValue: number;
  finalAmountValue: number;
  createdByText: string;
}

@Component({
  selector: 'app-purchase-order-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AgGridAngular],
  templateUrl: './purchase-order-list.component.html',
  styleUrl: './purchase-order-list.component.scss'
})
export class PurchaseOrderListComponent implements OnInit {
  filterForm: FormGroup;
  rows: PurchaseOrder[] = [];
  gridRows: PurchaseOrderGridRow[] = [];
  loading = signal(true);
  error = signal<string | null>(null);
  selectedOrder: PurchaseOrderGridRow | null = null;
  private gridApi!: GridApi<PurchaseOrderGridRow>;
  readonly LAYOUT_KEY = 'purchase_order_list';

  readonly rowSelection: 'single' = 'single';
  readonly overlayNoRowsTemplate = '<span class="po-grid-empty">No Rows To Show</span>';
  readonly defaultColDef: ColDef<PurchaseOrderGridRow> = {
    sortable: false,
    resizable: true
  };
  readonly columnDefs: ColDef<PurchaseOrderGridRow>[] = [
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
      headerName: 'ORDER NO',
      field: 'orderNoText',
      width: 145,
      minWidth: 135
    },
    {
      headerName: 'ORDER DATE',
      field: 'orderDateText',
      width: 140,
      minWidth: 130
    },
    {
      headerName: 'SUPPLIER ORDER NO',
      field: 'supplierOrderText',
      width: 175,
      minWidth: 165
    },
    {
      headerName: 'SUPPLIER',
      field: 'supplierText',
      width: 240,
      minWidth: 200
    },
    {
      headerName: 'CURRENCY',
      field: 'currencyText',
      width: 120,
      minWidth: 110
    },
    {
      headerName: 'NET AMOUNT',
      field: 'netAmountValue',
      width: 135,
      minWidth: 125,
      cellClass: 'po-cell-right',
      headerClass: 'po-header-right',
      valueFormatter: (params) => this.formatAmountValue(params)
    },
    {
      headerName: 'TAX AMOUNT',
      field: 'taxAmountValue',
      width: 135,
      minWidth: 125,
      cellClass: 'po-cell-right',
      headerClass: 'po-header-right',
      valueFormatter: (params) => this.formatAmountValue(params)
    },
    {
      headerName: 'TOTAL AMOUNT',
      field: 'totalAmountValue',
      width: 150,
      minWidth: 145,
      cellClass: 'po-cell-right',
      headerClass: 'po-header-right',
      valueFormatter: (params) => this.formatAmountValue(params)
    },
    {
      headerName: 'FINAL AMOUNT',
      field: 'finalAmountValue',
      width: 150,
      minWidth: 145,
      cellClass: 'po-cell-right',
      headerClass: 'po-header-right',
      valueFormatter: (params) => this.formatAmountValue(params)
    },
    {
      headerName: 'CREATED BY',
      field: 'createdByText',
      width: 160,
      minWidth: 150
    }
  ];

  constructor(
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly toastService: ToastService,
    private readonly gridLayoutService: GridLayoutService
  ) {
    this.filterForm = this.fb.group({
      status: [''],
      search: [''],
      dateFrom: [''],
      dateTo: ['']
    });
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedOrder = null;
    const status = this.filterForm.get('status')?.value as PurchaseOrderStatus | '' | null;
    this.purchaseOrderService
      .getList({ status: status || undefined })
      .subscribe({
        next: (res) => {
          const data = this.applyClientFilters(res.data ?? []);
          this.rows = data;
          this.gridRows = data.map((row, index) => this.mapGridRow(row, index));
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? err?.message ?? 'Failed to load list');
          this.rows = [];
          this.gridRows = [];
          this.loading.set(false);
        }
      });
  }

  applyFilter(): void {
    this.loadOrders();
  }

  clearFilters(): void {
    this.filterForm.reset({
      status: '',
      search: '',
      dateFrom: '',
      dateTo: ''
    });
    this.loadOrders();
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

  get footerStart(): number {
    return this.rows.length === 0 ? 0 : 1;
  }

  get footerEnd(): number {
    return this.rows.length;
  }

  get footerTotalPages(): number {
    return this.rows.length === 0 ? 0 : 1;
  }

  get selectedRecordText(): string {
    const list = this.gridRows;
    const order = this.selectedOrder;
    if (!order) {
      return `Record 0 of ${list.length}`;
    }
    const idx = list.findIndex(r => r.id === order.id);
    return `Record ${idx + 1} of ${list.length}`;
  }

  goToCreate(): void {
    this.router.navigate(['/po/manual']);
  }

  goToEditSelected(): void {
    const order = this.selectedOrder;
    if (order) {
      if (order.invoiceId) {
        this.router.navigate(['/po/review', order.invoiceId]);
      } else if (order.id) {
        this.router.navigate(['/po/manual/edit', order.id]);
      }
    }
  }

  goToPreviewSelected(): void {
    const order = this.selectedOrder;
    if (order && order.id) {
      this.router.navigate(['/po/manual/preview', order.id]);
    }
  }

  refreshList(): void {
    this.loadOrders();
    this.toastService.success('Purchase Order list refreshed successfully');
  }

  deleteSelected(): void {
    const order = this.selectedOrder;
    if (!order || !order.id) {
      this.toastService.warning('Please select a purchase order to delete');
      return;
    }

    if (confirm(`Are you sure you want to delete purchase order ${order.orderNumber}?`)) {
      this.purchaseOrderService.remove(order.id).subscribe({
        next: () => {
          this.toastService.success('Purchase Order deleted successfully');
          this.selectedOrder = null;
          this.loadOrders();
        },
        error: (err) => {
          console.error('Failed to delete purchase order:', err);
          this.toastService.error('Failed to delete purchase order: ' + (err.message || ''));
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

    const headers = ['SR NO', 'STATUS', 'ORDER NO', 'ORDER DATE', 'SUPPLIER ORDER NO', 'SUPPLIER', 'CURRENCY', 'NET AMOUNT', 'TAX AMOUNT', 'TOTAL AMOUNT', 'CREATED BY'];
    const rows = this.gridRows.map(row => [
      row.srNo,
      `"${row.statusText}"`,
      `"${row.orderNoText}"`,
      `"${row.orderDateText}"`,
      `"${row.supplierOrderText}"`,
      `"${row.supplierText}"`,
      `"${row.currencyText}"`,
      row.netAmountValue,
      row.taxAmountValue,
      row.totalAmountValue,
      `"${row.createdByText}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'purchase_orders_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toastService.success('Purchase orders exported to CSV successfully');
  }

  onRowDoubleClicked(event: any): void {
    if (event.data && event.data.invoiceId) {
      this.router.navigate(['/po/review', event.data.invoiceId]);
    } else if (event.data && event.data.id) {
      this.router.navigate(['/po/manual/edit', event.data.id]);
    }
  }

  onGridReady(event: GridReadyEvent<PurchaseOrderGridRow>): void {
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

  onSelectionChanged(event: SelectionChangedEvent<PurchaseOrderGridRow>): void {
    this.selectedOrder = event.api.getSelectedRows()[0] ?? null;
  }

  formatAmount(value: number): string {
    return value.toFixed(2);
  }

  private formatAmountValue(params: ValueFormatterParams<PurchaseOrderGridRow, number>): string {
    return this.formatAmount(Number(params.value) || 0);
  }

  private applyClientFilters(data: PurchaseOrder[]): PurchaseOrder[] {
    const search = String(this.filterForm.get('search')?.value ?? '').trim().toLowerCase();
    const fromDate = this.parseFilterDate(String(this.filterForm.get('dateFrom')?.value ?? ''));
    const toDate = this.parseFilterDate(String(this.filterForm.get('dateTo')?.value ?? ''), true);

    return data.filter((order) => {
      if (search && !this.matchesSearch(order, search)) {
        return false;
      }

      const orderDate = this.parseDate(this.getDateSource(order));
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

  private matchesSearch(order: PurchaseOrder, search: string): boolean {
    const candidate = order as Record<string, unknown>;
    const values = [
      order.poNumber,
      order.orderNumber,
      order.vendorName,
      order.supplierName,
      this.getStringValue(candidate, ['supplierOrderNo', 'supplierOrderNumber', 'supplierOrder']),
      this.getStringValue(candidate, ['createdBy', 'createdByName', 'createdUser', 'createdUserName'])
    ];

    return values.some((value) => String(value ?? '').toLowerCase().includes(search));
  }

  private mapGridRow(order: PurchaseOrder, index: number): PurchaseOrderGridRow {
    const candidate = order as Record<string, unknown>;
    const totalAmountValue = Number(order.totalAmount) || 0;
    const finalAmountValue = this.getNumberValue(candidate, ['finalAmount', 'grandTotal', 'netPayable'], totalAmountValue);

    return {
      ...order,
      srNo: index + 1,
      statusText: String(order.status ?? '').toUpperCase(),
      orderNoText: this.getStringValue(candidate, ['poNumber', 'orderNumber', 'invoiceId']),
      orderDateText: this.formatDate(this.getDateSource(order)),
      supplierOrderText: this.getStringValue(candidate, ['supplierOrderNo', 'supplierOrderNumber', 'supplierOrder']),
      supplierText: this.getStringValue(candidate, ['vendorName', 'supplierName']),
      currencyText: this.getStringValue(candidate, ['currency', 'currencyCode'], 'INR'),
      netAmountValue: Number(order.subtotal) || 0,
      taxAmountValue: Number(order.taxAmount) || 0,
      totalAmountValue,
      finalAmountValue,
      createdByText: this.getStringValue(candidate, ['createdBy', 'createdByName', 'createdUser', 'createdUserName'])
    };
  }

  private getDateSource(order: PurchaseOrder): string {
    const candidate = order as Record<string, unknown>;
    return this.getStringValue(candidate, ['orderDate', 'createdAt', 'updatedAt']);
  }

  private getStringValue(record: Record<string, unknown>, keys: string[], fallback = ''): string {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
      if (typeof value === 'number') {
        return String(value);
      }
    }

    return fallback;
  }

  private getNumberValue(record: Record<string, unknown>, keys: string[], fallback = 0): number {
    for (const key of keys) {
      const value = Number(record[key]);
      if (!Number.isNaN(value) && Number.isFinite(value)) {
        return value;
      }
    }

    return fallback;
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
