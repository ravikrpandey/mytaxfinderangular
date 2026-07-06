import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReceiptService, Receipt, ReceiptAllocation } from '../services/receipt.service';
import { SalesInvoiceService } from '../../sales/services/sales-invoice.service';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-receipt-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './receipt-form.component.html',
  styleUrl: './receipt-form.component.scss',
})
export class ReceiptFormComponent implements OnInit {
  receiptForm!: FormGroup;
  mode = signal<'create' | 'edit' | 'preview'>('create');
  receiptId = signal<string | null>(null);
  loading = signal(false);
  submitting = signal(false);

  customers = signal<any[]>([]);
  receiptAmount = signal<number>(0);

  // Form group wrapper mode title
  modeTitle = computed(() => {
    switch (this.mode()) {
      case 'edit':
        return 'EDIT CUSTOMER RECEIPT';
      case 'preview':
        return 'PREVIEW CUSTOMER RECEIPT';
      default:
        return 'CREATE NEW CUSTOMER RECEIPT';
    }
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly receiptService: ReceiptService,
    private readonly salesInvoiceService: SalesInvoiceService,
    private readonly apiService: ApiService,
    private readonly toastService: ToastService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    const segments = this.route.snapshot.url.map(s => s.path);
    const id = this.route.snapshot.paramMap.get('id');

    if (segments.includes('preview') && id) {
      this.mode.set('preview');
      this.receiptId.set(id);
    } else if (segments.includes('edit') && id) {
      this.mode.set('edit');
      this.receiptId.set(id);
    } else {
      this.mode.set('create');
    }

    this.loadCustomers();
  }

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];
    this.receiptForm = this.fb.group({
      receiptNo: [{ value: '', disabled: true }],
      customerId: ['', Validators.required],
      customerName: [''],
      receiptDate: [today, Validators.required],
      paymentMode: ['CASH', Validators.required],
      referenceNo: [''],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      notes: [''],
      allocations: this.fb.array([]),
    });

    if (this.mode() === 'preview') {
      this.receiptForm.disable();
    }
  }

  get allocationsFormArray(): FormArray {
    return this.receiptForm.get('allocations') as FormArray;
  }

  private loadCustomers(): void {
    this.loading.set(true);
    this.apiService.getOrganisations().subscribe({
      next: (res: any) => {
        if (res?.success && res.data) {
          const mapped = res.data.map((item: any) => ({
            id: item.id,
            orgName: item.customer_name,
            orgCode: item.customer_code,
          }));
          this.customers.set(mapped);

          const rId = this.receiptId();
          if (rId) {
            this.loadReceiptDetails(rId);
          } else {
            this.generateNumber();
            this.loading.set(false);
          }
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Failed to load customers:', err);
        this.toastService.error('Failed to load customers list');
        this.loading.set(false);
      },
    });
  }

  private generateNumber(): void {
    this.receiptService.generateReceiptNo().subscribe({
      next: (res) => {
        if (res.receiptNo) {
          this.receiptForm.patchValue({ receiptNo: res.receiptNo });
        }
      },
      error: (err) => console.error('Failed to generate receipt number:', err),
    });
  }

  private loadReceiptDetails(id: string): void {
    this.receiptService.getOne(id).subscribe({
      next: (rc: Receipt) => {
        this.receiptForm.patchValue({
          receiptNo: rc.receiptNo,
          customerId: rc.customerId,
          customerName: rc.customerName,
          receiptDate: rc.receiptDate,
          paymentMode: rc.paymentMode,
          referenceNo: rc.referenceNo,
          amount: rc.amount,
          notes: rc.notes,
        });

        this.receiptAmount.set(Number(rc.amount) || 0);

        if (this.mode() === 'preview') {
          this.receiptForm.disable();
        }

        // Load outstanding invoices + map current receipt allocations
        this.loadInvoicesForCustomer(rc.customerId, rc.allocations || []);
      },
      error: (err) => {
        console.error('Failed to load receipt details:', err);
        this.toastService.error('Failed to load receipt details');
        this.loading.set(false);
      },
    });
  }

  onCustomerChanged(): void {
    const custId = this.receiptForm.get('customerId')?.value;
    const customerObj = this.customers().find((c) => Number(c.id) === Number(custId));
    if (customerObj) {
      this.receiptForm.patchValue({ customerName: customerObj.orgName });
    }
    this.allocationsFormArray.clear();
    if (custId) {
      this.loadInvoicesForCustomer(custId, []);
    }
  }

  onAmountChanged(): void {
    const val = Number(this.receiptForm.get('amount')?.value) || 0;
    this.receiptAmount.set(val);
  }

  private loadInvoicesForCustomer(customerId: number, currentAllocations: ReceiptAllocation[]): void {
    this.salesInvoiceService.getAll({ customerId }).subscribe({
      next: (res) => {
        this.allocationsFormArray.clear();
        const invoices = res.data || [];

        // Build mapping of active invoice allocations in current receipt
        const allocMap = new Map<number, number>();
        currentAllocations.forEach((a) => {
          allocMap.set(Number(a.salesInvoiceId), Number(a.allocatedAmount));
        });

        // Filter and map: we want invoices with outstanding > 0 OR already allocated in this receipt
        invoices.forEach((inv) => {
          if (inv.status === 'DRAFT' || inv.status === 'CANCELLED') {
            return;
          }

          const currentAllocAmount = allocMap.get(Number(inv.id)) || 0;
          // outstandingAmount from API is already reduced by other allocations.
          // For the current receipt, we want the outstanding amount *before* this receipt's allocation was applied:
          const outstandingBeforeCurrentReceipt = Number(inv.outstandingAmount) + currentAllocAmount;

          if (outstandingBeforeCurrentReceipt > 0 || currentAllocAmount > 0) {
            const row = this.fb.group({
              salesInvoiceId: [inv.id],
              invoiceNo: [inv.invoiceNo],
              invoiceDateText: [this.formatDate(inv.invoiceDate)],
              totalAmount: [Number(inv.totalAmount)],
              outstandingAmount: [outstandingBeforeCurrentReceipt],
              allocatedAmount: [
                {
                  value: currentAllocAmount || null,
                  disabled: this.mode() === 'preview',
                },
                [Validators.min(0)],
              ],
            });
            this.allocationsFormArray.push(row);
          }
        });

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load outstanding invoices:', err);
        this.toastService.error('Failed to load outstanding invoices');
        this.loading.set(false);
      },
    });
  }

  totalAllocated = computed(() => {
    let sum = 0;
    // Signal doesn't trigger on reactive form array input directly.
    // We will parse the form array value manually.
    const formVals = this.allocationsFormArray.getRawValue();
    formVals.forEach((val: any) => {
      sum += Number(val.allocatedAmount) || 0;
    });
    return sum;
  });

  unallocated = computed(() => {
    return Math.max(0, this.receiptAmount() - this.totalAllocated());
  });

  onAllocationInput(index: number): void {
    const row = this.allocationsFormArray.at(index);
    const outstanding = Number(row.get('outstandingAmount')?.value) || 0;
    let allocated = Number(row.get('allocatedAmount')?.value) || 0;

    if (allocated < 0) {
      allocated = 0;
      row.get('allocatedAmount')?.setValue(null);
    } else if (allocated > outstanding) {
      allocated = outstanding;
      row.get('allocatedAmount')?.setValue(outstanding);
      this.toastService.warning(`Cannot allocate more than outstanding amount (${outstanding.toFixed(2)})`);
    }

    // Force recalculating computed values by updating receiptAmount signal
    this.receiptAmount.set(this.receiptAmount());
  }

  autoAllocate(): void {
    const totalToAllocate = this.receiptAmount();
    if (totalToAllocate <= 0) {
      this.toastService.warning('Please enter a Receipt Amount first');
      return;
    }

    let remaining = totalToAllocate;
    const len = this.allocationsFormArray.length;

    for (let i = 0; i < len; i++) {
      const row = this.allocationsFormArray.at(i);
      const outstanding = Number(row.get('outstandingAmount')?.value) || 0;

      if (remaining > 0) {
        const alloc = Math.min(outstanding, remaining);
        row.get('allocatedAmount')?.setValue(Number(alloc.toFixed(2)));
        remaining -= alloc;
      } else {
        row.get('allocatedAmount')?.setValue(null);
      }
    }

    this.receiptAmount.set(totalToAllocate);
    this.toastService.success('Auto-allocation completed');
  }

  onCancel(): void {
    this.router.navigate(['/receipt']);
  }

  isInvalid(controlName: string): boolean {
    const ctrl = this.receiptForm.get(controlName);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  onSave(): void {
    if (this.receiptForm.invalid) {
      this.toastService.warning('Please resolve all validation errors');
      return;
    }

    const payload = this.receiptForm.getRawValue();
    const totalAlloc = this.totalAllocated();

    if (totalAlloc > payload.amount) {
      this.toastService.warning(`Total allocations (${totalAlloc.toFixed(2)}) exceed receipt amount (${payload.amount.toFixed(2)})`);
      return;
    }

    // Only submit allocations that have a positive value
    const allocationsList = (payload.allocations || [])
      .filter((a: any) => Number(a.allocatedAmount) > 0)
      .map((a: any) => ({
        salesInvoiceId: a.salesInvoiceId,
        allocatedAmount: Number(a.allocatedAmount),
      }));

    const body: Partial<Receipt> = {
      receiptNo: payload.receiptNo,
      customerId: Number(payload.customerId),
      customerName: payload.customerName,
      receiptDate: payload.receiptDate,
      paymentMode: payload.paymentMode,
      referenceNo: payload.referenceNo,
      amount: Number(payload.amount),
      notes: payload.notes,
      allocations: allocationsList as any,
    };

    this.submitting.set(true);
    const rId = this.receiptId();

    const request$ = rId
      ? this.receiptService.update(rId, body)
      : this.receiptService.create(body);

    request$.subscribe({
      next: () => {
        this.toastService.success(rId ? 'Receipt updated successfully' : 'Receipt created successfully');
        this.submitting.set(false);
        this.router.navigate(['/receipt']);
      },
      error: (err) => {
        console.error('Failed to save receipt:', err);
        this.toastService.error(err?.message ?? 'Failed to save receipt');
        this.submitting.set(false);
      },
    });
  }

  private formatDate(value: string): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
}
