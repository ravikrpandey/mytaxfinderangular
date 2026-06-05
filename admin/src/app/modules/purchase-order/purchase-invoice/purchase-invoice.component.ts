import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { PurchaseOrderService, PurchaseOrder } from '../services/purchase-order.service';

@Component({
  selector: 'app-purchase-invoice',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './purchase-invoice.component.html',
  styleUrl: './purchase-invoice.component.scss'
})
export class PurchaseInvoiceComponent implements OnInit {
  filterForm: FormGroup;
  rows: PurchaseOrder[] = [];
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      dateFrom: [''],
      dateTo: [''],
      search: ['']
    });
  }

  getInvoiceNumber(row: PurchaseOrder): string {
    const raw = (row as Record<string, unknown>)['veryfiRawResponse'] as { invoice_number?: string } | undefined;
    return raw?.invoice_number ?? row.poNumber ?? '';
  }

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading.set(true);
    this.error.set(null);
    this.purchaseOrderService.getList().subscribe({
      next: (res) => {
        let data = res.data ?? [];
        const search = (this.filterForm.get('search')?.value ?? '').trim().toLowerCase();
        if (search) {
          data = data.filter(
            (row) =>
              (row.poNumber as string | undefined)?.toLowerCase().includes(search) ||
              (row.vendorName as string | undefined)?.toLowerCase().includes(search)
          );
        }
        this.rows = data;
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? err?.message ?? 'Failed to load invoices');
        this.rows = [];
        this.loading.set(false);
      }
    });
  }

  applyFilter(): void {
    this.loadInvoices();
  }

  clearFilters(): void {
    this.filterForm.reset({
      dateFrom: '',
      dateTo: '',
      search: ''
    });
    this.loadInvoices();
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
}

