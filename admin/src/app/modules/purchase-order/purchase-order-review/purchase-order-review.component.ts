import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import {
  PurchaseOrderService,
  PurchaseOrderDraft,
  PurchaseOrderVendor,
  ConfirmPurchaseOrderPayload
} from '../services/purchase-order.service';

@Component({
  selector: 'app-purchase-order-review',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './purchase-order-review.component.html',
  styleUrl: './purchase-order-review.component.scss'
})
export class PurchaseOrderReviewComponent implements OnInit {
  invoiceId: string | null = null;
  loading = signal(true);
  error = signal<string | null>(null);
  actionInProgress = signal(false);
  vendor = signal<PurchaseOrderVendor | null>(null);

  form!: FormGroup;

  get lineItems(): FormArray {
    return this.form.get('lineItems') as FormArray;
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
    const tax = Number(this.form.get('tax')?.value) || 0;
    return this.subtotal() + tax;
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly purchaseOrderService: PurchaseOrderService
  ) {
    this.form = this.fb.group({
      lineItems: this.fb.array([]),
      tax: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('invoiceId');
    if (!id) {
      this.error.set('Invalid invoice ID');
      this.loading.set(false);
      return;
    }
    this.invoiceId = id;
    this.purchaseOrderService.getPurchaseOrderDraft(id).subscribe({
      next: (draft) => this.buildFormFromDraft(draft),
      error: (err) => {
        this.error.set(err?.error?.message ?? err?.message ?? 'Failed to load purchase order');
        this.loading.set(false);
      }
    });
  }

  private buildFormFromDraft(draft: PurchaseOrderDraft): void {
    this.loading.set(false);
    this.vendor.set(draft.vendor ?? null);

    const items = draft.lineItems?.length
      ? draft.lineItems
      : [{ description: '', quantity: 0, unitPrice: 0, amount: 0 }];

    this.lineItems.clear();
    items.forEach((item) => {
      this.lineItems.push(
        this.fb.group({
          description: [item.description || '', Validators.required],
          hsnCode: [item.hsnCode ?? ''],
          quantity: [item.quantity ?? 0, [Validators.required, Validators.min(0.001)]],
          unitPrice: [item.unitPrice ?? 0, [Validators.required, Validators.min(0)]]
        })
      );
    });

    // Initial tax: prefer backend tax; if zero/undefined, default to 18% of subtotal (GST)
    const backendTax = draft.tax ?? 0;
    const subtotal = this.subtotal();
    const effectiveTax = backendTax && backendTax > 0 ? backendTax : Math.round(subtotal * 0.18 * 100) / 100;

    this.form.patchValue({
      tax: effectiveTax
    });
  }

  addLine(): void {
    this.lineItems.push(
      this.fb.group({
        description: ['', Validators.required],
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

  confirmPurchaseOrder(): void {
    if (this.form.invalid || !this.invoiceId) {
      this.form.markAllAsTouched();
      this.error.set('Please fix validation errors.');
      return;
    }
    this.error.set(null);
    this.actionInProgress.set(true);

    const items = this.lineItems.controls.map((c) => {
      const q = Number(c.get('quantity')?.value) || 0;
      const u = Number(c.get('unitPrice')?.value) || 0;
      return {
        description: c.get('description')?.value ?? '',
        quantity: q,
        unitPrice: u,
        amount: q * u
      };
    });

    const payload: ConfirmPurchaseOrderPayload = {
      lineItems: items,
      subtotal: this.subtotal(),
      tax: Number(this.form.get('tax')?.value) || 0,
      total: this.total()
    };

    this.purchaseOrderService.confirmPurchaseOrder(this.invoiceId, payload).subscribe({
      next: () => {
        this.actionInProgress.set(false);
        this.router.navigate(['/po/list']);
      },
      error: (err) => {
        this.actionInProgress.set(false);
        this.error.set(err?.error?.message ?? err?.message ?? 'Failed to confirm purchase order.');
      }
    });
  }
}
