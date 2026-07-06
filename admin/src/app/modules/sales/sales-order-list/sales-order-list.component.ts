import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, SelectionChangedEvent, ValueFormatterParams, GridApi } from 'ag-grid-community';
import { SalesOrderService, SalesOrder } from '../services/sales-order.service';
import { ToastService } from '../../../services/toast.service';
import { GridLayoutService } from '../../../services/grid-layout.service';

interface SOGridRow extends SalesOrder {
  id?: number | string;
  orderNo: string;
  srNo: number;
  orderDateText: string;
  dueDateText: string;
  netAmountValue: number;
  taxAmountValue: number;
  totalAmountValue: number;
  customerName: string;
  orderType: 'NORMAL' | 'PROFORMA';
  customerOrder: string;
  status: 'DRAFT' | 'OPEN' | 'CONFIRMED' | 'CANCELLED';
}

@Component({
  selector: 'app-sales-order-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AgGridAngular, RouterModule],
  templateUrl: './sales-order-list.component.html',
  styleUrl: './sales-order-list.component.scss'
})
export class SalesOrderListComponent implements OnInit {
  filterForm: FormGroup;
  rows: SalesOrder[] = [];
  gridRows: SOGridRow[] = [];
  loading = signal(true);
  error = signal<string | null>(null);
  selectedRow: SOGridRow | null = null;

  readonly rowSelection: 'single' = 'single';
  readonly overlayNoRowsTemplate = '<span class="pi-grid-empty">No Rows To Show</span>';
  private gridApi!: GridApi<SOGridRow>;
  readonly LAYOUT_KEY = 'sales_order_list';

  readonly defaultColDef: ColDef<SOGridRow> = {
    sortable: false,
    resizable: true
  };

  readonly columnDefs: ColDef<SOGridRow>[] = [
    { headerName: 'SR NO', field: 'srNo', width: 80, minWidth: 70, maxWidth: 90, pinned: 'left' },
    { headerName: 'STATUS', field: 'status', width: 120, minWidth: 110, valueFormatter: (p) => String(p.value ?? '').toUpperCase() },
    { headerName: 'ORDER NO', field: 'orderNo', width: 160, minWidth: 140 },
    { headerName: 'CUSTOMER', field: 'customerName', width: 200, minWidth: 160 },
    { headerName: 'ORDER DATE', field: 'orderDateText', width: 140, minWidth: 130 },
    { headerName: 'DUE DATE', field: 'dueDateText', width: 130, minWidth: 120 },
    { headerName: 'TYPE', field: 'orderType', width: 100, minWidth: 90, valueFormatter: (p) => String(p.value ?? '').toUpperCase() },
    { headerName: 'CUSTOMER ORDER', field: 'customerOrder', width: 160, minWidth: 140 },
    {
      headerName: 'NET AMOUNT', field: 'netAmountValue', width: 140, minWidth: 130,
      cellClass: 'pi-cell-right', headerClass: 'pi-header-right',
      valueFormatter: (p: ValueFormatterParams<SOGridRow, number>) => (Number(p.value) || 0).toFixed(2)
    },
    {
      headerName: 'TAX AMOUNT', field: 'taxAmountValue', width: 130, minWidth: 120,
      cellClass: 'pi-cell-right', headerClass: 'pi-header-right',
      valueFormatter: (p: ValueFormatterParams<SOGridRow, number>) => (Number(p.value) || 0).toFixed(2)
    },
    {
      headerName: 'TOTAL AMOUNT', field: 'totalAmountValue', width: 140, minWidth: 130,
      cellClass: 'pi-cell-right', headerClass: 'pi-header-right',
      valueFormatter: (p: ValueFormatterParams<SOGridRow, number>) => (Number(p.value) || 0).toFixed(2)
    }
  ];

  constructor(
    private readonly service: SalesOrderService,
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly toastService: ToastService,
    private readonly gridLayoutService: GridLayoutService
  ) {
    this.filterForm = this.fb.group({ search: [''], dateFrom: [''], dateTo: [''] });
  }

  ngOnInit(): void { this.loadList(); }

  loadList(): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedRow = null;
    this.service.getAll().subscribe({
      next: (res: any) => {
        const data = this.applyFilters(res.data ?? []);
        this.rows = data;
        this.gridRows = data.map((r, i) => this.mapRow(r, i));
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err?.message ?? 'Failed to load sales orders');
        this.rows = [];
        this.gridRows = [];
        this.loading.set(false);
      }
    });
  }

  applyFilter(): void { this.loadList(); }

  clearFilters(): void {
    this.filterForm.reset({ search: '', dateFrom: '', dateTo: '' });
    this.loadList();
  }

  get totalNetAmount(): number { return this.rows.reduce((s, r) => s + (Number(r.subtotal) || 0), 0); }
  get totalTaxAmount(): number { return this.rows.reduce((s, r) => s + (Number(r.taxAmount) || 0), 0); }
  get totalAmount(): number { return this.rows.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0); }

  get selectedRecordText(): string {
    const item = this.selectedRow;
    if (!item) return `Record 0 of ${this.gridRows.length}`;
    const idx = this.gridRows.findIndex(r => r.id === item.id);
    return `Record ${idx + 1} of ${this.gridRows.length}`;
  }

  goToCreate(): void { this.router.navigate(['/sales/sales-order/create']); }
  goToEditSelected(): void { if (this.selectedRow?.id) this.router.navigate(['/sales/sales-order/edit', this.selectedRow.id]); }
  goToPreviewSelected(): void { if (this.selectedRow?.id) this.router.navigate(['/sales/sales-order/preview', this.selectedRow.id]); }
  refreshList(): void { this.loadList(); this.toastService.success('Sales order list refreshed'); }

  deleteSelected(): void {
    if (!this.selectedRow?.id) { this.toastService.warning('Please select a record to delete'); return; }
    if (confirm(`Delete sales order ${this.selectedRow.orderNo}?`)) {
      this.service.remove(this.selectedRow.id).subscribe({
        next: () => { this.toastService.success('Deleted successfully'); this.selectedRow = null; this.loadList(); },
        error: (err: any) => this.toastService.error('Failed to delete: ' + (err.message || ''))
      });
    }
  }

  exportToCSV(): void {
    if (this.rows.length === 0) { this.toastService.warning('No data to export'); return; }
    const headers = ['SR NO', 'STATUS', 'ORDER NO', 'CUSTOMER', 'ORDER DATE', 'DUE DATE', 'TYPE', 'CUSTOMER ORDER', 'NET AMOUNT', 'TAX AMOUNT', 'TOTAL AMOUNT'];
    const rows = this.gridRows.map(r => [r.srNo, `"${r.status}"`, `"${r.orderNo}"`, `"${r.customerName}"`, `"${r.orderDateText}"`, `` + r.dueDateText, `"${r.orderType}"`, `"${r.customerOrder}"`, r.netAmountValue, r.taxAmountValue, r.totalAmountValue]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sales_orders.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    this.toastService.success('Exported successfully');
  }

  onRowDoubleClicked(event: any): void { if (event.data?.id) this.router.navigate(['/sales/sales-order/edit', event.data.id]); }
  onGridReady(event: GridReadyEvent<SOGridRow>): void { this.gridApi = event.api; this.gridLayoutService.restoreLayout(this.LAYOUT_KEY, this.gridApi); }
  saveLayout(): void { this.gridLayoutService.saveLayout(this.LAYOUT_KEY, this.gridApi); this.toastService.success('Layout saved'); }
  resetLayout(): void { this.gridLayoutService.resetLayout(this.LAYOUT_KEY, this.gridApi, this.columnDefs); this.toastService.success('Layout reset'); }
  onSelectionChanged(event: SelectionChangedEvent<SOGridRow>): void { this.selectedRow = event.api.getSelectedRows()[0] ?? null; }

  private applyFilters(data: SalesOrder[]): SalesOrder[] {
    const search = String(this.filterForm.get('search')?.value ?? '').trim().toLowerCase();
    const from = this.parseDateMs(this.filterForm.get('dateFrom')?.value ?? '');
    const to = this.parseDateMs(this.filterForm.get('dateTo')?.value ?? '', true);
    return data.filter(item => {
      if (search && !['orderNo', 'customerName', 'customerOrder', 'status'].some(k => String((item as any)[k] ?? '').toLowerCase().includes(search))) return false;
      const d = this.parseDateMs(item.orderDate || '');
      if (from !== null && (d === null || d < from)) return false;
      if (to !== null && (d === null || d > to)) return false;
      return true;
    });
  }

  private parseDateMs(value: string, endOfDay = false): number | null {
    if (!value?.trim()) return null;
    const d = new Date(value.trim());
    if (isNaN(d.getTime())) return null;
    if (endOfDay) d.setHours(23, 59, 59, 999); else d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  private formatDate(value: string): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  }

  private mapRow(r: SalesOrder, i: number): SOGridRow {
    return {
      ...r,
      srNo: i + 1,
      customerName: r.customerName || '',
      orderType: r.orderType || 'NORMAL',
      customerOrder: r.customerOrder || '',
      status: r.status || 'OPEN',
      orderDateText: this.formatDate(r.orderDate || ''),
      dueDateText: this.formatDate(r.dueDate || ''),
      netAmountValue: Number(r.subtotal) || 0,
      taxAmountValue: Number(r.taxAmount) || 0,
      totalAmountValue: Number(r.totalAmount) || 0
    };
  }
}
