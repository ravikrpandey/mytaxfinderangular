import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { PurchaseOrderService, PurchaseOrderStatus } from '../services/purchase-order.service';

@Component({
  selector: 'app-purchase-order-manual',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './purchase-order-manual.component.html',
  styleUrl: './purchase-order-manual.component.scss'
})
export class PurchaseOrderManualComponent implements OnInit {
  loading = signal(false);
  error = signal<string | null>(null);
  actionInProgress = signal(false);

  poForm: FormGroup;
  readonly statusOptions: PurchaseOrderStatus[] = ['draft', 'pending', 'approved', 'rejected'];
  readonly currencyOptions = ['INR - Indian Rupee', 'Pound Sterling - GBP', 'US Dollar - USD', 'Euro - EUR'];

  get lineItems(): FormArray {
    return this.poForm.get('lineItems') as FormArray;
  }

  get lineItemIndices(): number[] {
    const len = this.lineItems?.length ?? 0;
    return Array.from({ length: len }, (_, i) => i);
  }

  subtotal = computed(() => {
    const arr = this.lineItems;
    if (!arr?.length) return 0;
    return arr.controls.reduce((sum, c) => {
      const q = Number(c.get('quantity')?.value) || 0;
      const u = Number(c.get('unitPrice')?.value) || 0;
      return sum + q * u;
    }, 0);
  });

  total = computed(() => {
    const tax = Number(this.poForm.get('tax')?.value) || 0;
    return this.subtotal() + tax;
  });

  landedAmount = computed(() => this.total());

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly purchaseOrderService: PurchaseOrderService
  ) {
    this.poForm = this.fb.group({
      vendorName: ['', [Validators.required]],
      contactName: [''],
      contactPhone: [''],
      vendorAddress: [''],
      vendorPhone: [''],
      vendorGSTIN: [''],
      supplierReference: [''],
      status: ['draft', Validators.required],
      currency: ['Pound Sterling - GBP', Validators.required],
      exchangeRate: [1, [Validators.required, Validators.min(0.00001)]],
      comments: [''],
      orderNumber: ['', Validators.required],
      orderDate: [this.todayDateString(), Validators.required],
      lineItems: this.fb.array([]),
      tax: [0, [Validators.required, Validators.min(0)]]
    });

    this.addLine();
  }

  ngOnInit(): void {
    this.purchaseOrderService.generatePoNumber().subscribe({
      next: (response) => {
        if (response.poNumber) {
          this.poForm.patchValue({ orderNumber: response.poNumber });
        }
      },
      error: () => {
        this.poForm.patchValue({ orderNumber: `PO-${this.buildFallbackNumber()}` });
      }
    });
  }

  addLine(): void {
    this.lineItems.push(
      this.fb.group({
        productCode: [''],
        description: ['', Validators.required],
        partNumber: [''],
        size: [''],
        finish: [''],
        packaging: [''],
        boxQty: [0, [Validators.min(0)]],
        hsnCode: [''],
        quantity: [0, [Validators.required, Validators.min(0.001)]],
        unitPrice: [0, [Validators.required, Validators.min(0)]]
      })
    );
  }

  removeLine(index: number): void {
    if (this.lineItems.length > 1) {
      this.lineItems.removeAt(index);
    }
  }

  lineTotal(index: number): number {
    const c = this.lineItems.at(index);
    const q = Number(c?.get('quantity')?.value) || 0;
    const u = Number(c?.get('unitPrice')?.value) || 0;
    return q * u;
  }

  private ensureTax(): void {
    const currentTax = Number(this.poForm.get('tax')?.value) || 0;
    if (currentTax > 0) return;
    const subtotal = this.subtotal();
    const effectiveTax = Math.round(subtotal * 0.18 * 100) / 100;
    this.poForm.patchValue({ tax: effectiveTax });
  }

  submit(): void {
    if (this.poForm.invalid) {
      this.poForm.markAllAsTouched();
      this.error.set('Please fill in required fields.');
      return;
    }

    this.ensureTax();
    this.error.set(null);
    this.actionInProgress.set(true);

    const items = this.lineItems.controls.map((c) => {
      const q = Number(c.get('quantity')?.value) || 0;
      const u = Number(c.get('unitPrice')?.value) || 0;
      return {
        description: c.get('description')?.value ?? '',
        hsnCode: c.get('hsnCode')?.value ?? '',
        qty: q,
        rate: u,
        amount: q * u,
        productCode: c.get('productCode')?.value ?? '',
        partNumber: c.get('partNumber')?.value ?? '',
        size: c.get('size')?.value ?? '',
        finish: c.get('finish')?.value ?? '',
        packaging: c.get('packaging')?.value ?? '',
        boxQty: Number(c.get('boxQty')?.value) || 0
      };
    });

    const subtotal = this.subtotal();
    const tax = Number(this.poForm.get('tax')?.value) || 0;
    const total = subtotal + tax;

    const payload: Record<string, unknown> = {
      poNumber: this.poForm.get('orderNumber')?.value ?? '',
      orderNumber: this.poForm.get('orderNumber')?.value ?? '',
      vendorName: this.poForm.get('vendorName')?.value ?? '',
      supplierName: this.poForm.get('vendorName')?.value ?? '',
      vendorAddress: this.poForm.get('vendorAddress')?.value ?? '',
      vendorGSTIN: this.poForm.get('vendorGSTIN')?.value ?? '',
      orderDate: this.poForm.get('orderDate')?.value ?? null,
      status: this.poForm.get('status')?.value ?? 'draft',
      currency: this.poForm.get('currency')?.value ?? 'Pound Sterling - GBP',
      exchangeRate: Number(this.poForm.get('exchangeRate')?.value) || 1,
      supplierReference: this.poForm.get('supplierReference')?.value ?? '',
      contactName: this.poForm.get('contactName')?.value ?? '',
      contactPhone: this.poForm.get('contactPhone')?.value ?? '',
      vendorPhone: this.poForm.get('vendorPhone')?.value ?? '',
      comments: this.poForm.get('comments')?.value ?? '',
      subtotal,
      taxAmount: tax,
      totalAmount: total,
      items
    };

    this.purchaseOrderService.create(payload).subscribe({
      next: () => {
        this.actionInProgress.set(false);
        this.router.navigate(['/po/list']);
      },
      error: (err) => {
        this.actionInProgress.set(false);
        this.error.set(err?.message ?? 'Failed to create purchase order.');
      }
    });
  }

  private todayDateString(): string {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  private buildFallbackNumber(): string {
    const date = new Date();
    return `${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(date.getFullYear()).slice(-2)}`;
  }
}

