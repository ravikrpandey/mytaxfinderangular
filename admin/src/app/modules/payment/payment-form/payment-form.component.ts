import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService, Payment, PaymentAllocation } from '../services/payment.service';
import { PurchaseOrderService } from '../../purchase-order/services/purchase-order.service';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.scss',
})
export class PaymentFormComponent implements OnInit {
  paymentForm!: FormGroup;
  mode = signal<'create' | 'edit' | 'preview'>('create');
  paymentId = signal<string | null>(null);
  loading = signal(false);
  submitting = signal(false);

  vendors = signal<any[]>([]);
  paymentAmount = signal<number>(0);
  paymentTypeSignal = signal<'invoice_payment' | 'direct_expense'>('invoice_payment');

  readonly expenseCategories = [
    'Rent',
    'Utilities (Electricity, Water, internet)',
    'Office Supplies & Stationery',
    'Salaries & Wages',
    'Travel & Conveyance',
    'Marketing & Advertising',
    'Professional Fees / Consulting',
    'Repairs & Maintenance',
    'Software & Subscriptions',
    'Other Expenses',
  ];

  // Form group wrapper mode title
  modeTitle = computed(() => {
    switch (this.mode()) {
      case 'edit':
        return 'EDIT PAYMENT VOUCHER';
      case 'preview':
        return 'PREVIEW PAYMENT VOUCHER';
      default:
        return 'CREATE NEW PAYMENT VOUCHER';
    }
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly paymentService: PaymentService,
    private readonly purchaseOrderService: PurchaseOrderService,
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
      this.paymentId.set(id);
    } else if (segments.includes('edit') && id) {
      this.mode.set('edit');
      this.paymentId.set(id);
    } else {
      this.mode.set('create');
    }

    this.loadVendors();
  }

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];
    this.paymentForm = this.fb.group({
      paymentNo: [{ value: '', disabled: true }],
      paymentType: ['invoice_payment', Validators.required],
      vendorId: ['', Validators.required],
      vendorName: [''],
      expenseCategory: [''],
      paymentDate: [today, Validators.required],
      paymentMode: ['CASH', Validators.required],
      referenceNo: [''],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      notes: [''],
      allocations: this.fb.array([]),
    });

    // Listen to changes to adjust validators
    this.paymentForm.get('paymentType')?.valueChanges.subscribe(val => {
      this.paymentTypeSignal.set(val);
      const vendorIdCtrl = this.paymentForm.get('vendorId');
      const categoryCtrl = this.paymentForm.get('expenseCategory');
      if (val === 'invoice_payment') {
        vendorIdCtrl?.setValidators([Validators.required]);
        categoryCtrl?.clearValidators();
        categoryCtrl?.setValue('');
      } else {
        categoryCtrl?.setValidators([Validators.required]);
        vendorIdCtrl?.clearValidators();
        vendorIdCtrl?.setValue('');
        this.paymentForm.patchValue({ vendorName: '' });
        this.allocationsFormArray.clear();
      }
      vendorIdCtrl?.updateValueAndValidity();
      categoryCtrl?.updateValueAndValidity();
    });

    if (this.mode() === 'preview') {
      this.paymentForm.disable();
    }
  }

  get allocationsFormArray(): FormArray {
    return this.paymentForm.get('allocations') as FormArray;
  }

  private loadVendors(): void {
    this.loading.set(true);
    this.apiService.getOrganisations().subscribe({
      next: (res: any) => {
        if (res?.success && res.data) {
          const filtered = res.data.filter((item: any) => {
            const type = item.customer_type_names || (item.customerType ? item.customerType.list_name : '');
            return type.toUpperCase().includes('SUPPLIER');
          }).map((item: any) => ({
            id: item.id,
            orgName: item.customer_name,
            orgCode: item.customer_code,
          }));

          this.vendors.set(filtered);

          const pId = this.paymentId();
          if (pId) {
            this.loadPaymentDetails(pId);
          } else {
            this.generateNumber();
            this.loading.set(false);
          }
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Failed to load vendors:', err);
        this.toastService.error('Failed to load vendors list');
        this.loading.set(false);
      },
    });
  }

  private generateNumber(): void {
    this.paymentService.generatePaymentNo().subscribe({
      next: (res) => {
        if (res.paymentNo) {
          this.paymentForm.patchValue({ paymentNo: res.paymentNo });
        }
      },
      error: (err) => console.error('Failed to generate payment number:', err),
    });
  }

  private loadPaymentDetails(id: string): void {
    this.paymentService.getOne(id).subscribe({
      next: (pm: Payment) => {
        this.paymentForm.patchValue({
          paymentNo: pm.paymentNo,
          paymentType: pm.paymentType,
          vendorId: pm.vendorId,
          vendorName: pm.vendorName,
          expenseCategory: pm.expenseCategory,
          paymentDate: pm.paymentDate,
          paymentMode: pm.paymentMode,
          referenceNo: pm.referenceNo,
          amount: pm.amount,
          notes: pm.notes,
        });

        this.paymentAmount.set(Number(pm.amount) || 0);

        if (this.mode() === 'preview') {
          this.paymentForm.disable();
        }

        if (pm.paymentType === 'invoice_payment' && pm.vendorId) {
          this.loadPurchaseOrdersForVendor(pm.vendorId, pm.allocations || []);
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Failed to load payment details:', err);
        this.toastService.error('Failed to load payment details');
        this.loading.set(false);
      },
    });
  }

  onVendorChanged(): void {
    const vId = this.paymentForm.get('vendorId')?.value;
    const vendorObj = this.vendors().find((v) => Number(v.id) === Number(vId));
    if (vendorObj) {
      this.paymentForm.patchValue({ vendorName: vendorObj.orgName });
    }
    this.allocationsFormArray.clear();
    if (vId) {
      this.loadPurchaseOrdersForVendor(vId, []);
    }
  }

  onAmountChanged(): void {
    const val = Number(this.paymentForm.get('amount')?.value) || 0;
    this.paymentAmount.set(val);
  }

  private loadPurchaseOrdersForVendor(vendorId: number, currentAllocations: PaymentAllocation[]): void {
    const vendorObj = this.vendors().find((v) => Number(v.id) === Number(vendorId));
    const vendorName = vendorObj ? vendorObj.orgName : '';

    this.purchaseOrderService.getAll().subscribe({
      next: (res) => {
        this.allocationsFormArray.clear();
        const allPOs = res.data || [];

        // Build mapping of active PO allocations in current payment
        const allocMap = new Map<number, number>();
        currentAllocations.forEach((a) => {
          allocMap.set(Number(a.purchaseOrderId), Number(a.allocatedAmount));
        });

        // Filter for this vendor and outstanding POs
        const vendorPOs = allPOs.filter((po: any) => {
          return String(po.vendorName).trim().toLowerCase() === String(vendorName).trim().toLowerCase();
        });

        vendorPOs.forEach((po: any) => {
          if (po.status === 'draft' || po.status === 'cancelled') {
            return;
          }

          const currentAllocAmount = allocMap.get(Number(po.id)) || 0;
          const outstandingBeforeCurrentPayment = Number(po.outstandingAmount) + currentAllocAmount;

          if (outstandingBeforeCurrentPayment > 0 || currentAllocAmount > 0) {
            const row = this.fb.group({
              purchaseOrderId: [po.id],
              poNumber: [po.poNumber || po.orderNumber],
              orderDateText: [this.formatDate(po.orderDate)],
              totalAmount: [Number(po.totalAmount)],
              outstandingAmount: [outstandingBeforeCurrentPayment],
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
        console.error('Failed to load purchase orders:', err);
        this.toastService.error('Failed to load outstanding purchase orders');
        this.loading.set(false);
      },
    });
  }

  totalAllocated = computed(() => {
    let sum = 0;
    const formVals = this.allocationsFormArray.getRawValue();
    formVals.forEach((val: any) => {
      sum += Number(val.allocatedAmount) || 0;
    });
    return sum;
  });

  unallocated = computed(() => {
    return Math.max(0, this.paymentAmount() - this.totalAllocated());
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

    // Force recalculating computed values
    this.paymentAmount.set(this.paymentAmount());
  }

  autoAllocate(): void {
    const totalToAllocate = this.paymentAmount();
    if (totalToAllocate <= 0) {
      this.toastService.warning('Please enter a Payment Amount first');
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

    this.paymentAmount.set(totalToAllocate);
    this.toastService.success('Auto-allocation completed');
  }

  onCancel(): void {
    this.router.navigate(['/payment']);
  }

  isInvalid(controlName: string): boolean {
    const ctrl = this.paymentForm.get(controlName);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  onSave(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      this.toastService.warning('Please resolve all validation errors');
      return;
    }

    const payload = this.paymentForm.getRawValue();

    if (payload.paymentType === 'invoice_payment') {
      const totalAlloc = this.totalAllocated();
      if (totalAlloc > payload.amount) {
        this.toastService.warning(`Total allocations (${totalAlloc.toFixed(2)}) exceed payment amount (${payload.amount.toFixed(2)})`);
        return;
      }
    }

    // Filter allocations with positive allocatedAmount
    const allocationsList = (payload.allocations || [])
      .filter((a: any) => Number(a.allocatedAmount) > 0)
      .map((a: any) => ({
        purchaseOrderId: a.purchaseOrderId,
        allocatedAmount: Number(a.allocatedAmount),
      }));

    const body: Partial<Payment> = {
      paymentNo: payload.paymentNo,
      paymentType: payload.paymentType,
      vendorId: payload.vendorId ? Number(payload.vendorId) : undefined,
      vendorName: payload.vendorName || undefined,
      expenseCategory: payload.expenseCategory || undefined,
      paymentDate: payload.paymentDate,
      paymentMode: payload.paymentMode,
      referenceNo: payload.referenceNo,
      amount: Number(payload.amount),
      notes: payload.notes,
      allocations: payload.paymentType === 'invoice_payment' ? (allocationsList as any) : [],
    };

    this.submitting.set(true);
    const pId = this.paymentId();

    const request$ = pId
      ? this.paymentService.update(pId, body)
      : this.paymentService.create(body);

    request$.subscribe({
      next: () => {
        this.toastService.success(pId ? 'Payment updated successfully' : 'Payment created successfully');
        this.submitting.set(false);
        this.router.navigate(['/payment']);
      },
      error: (err) => {
        console.error('Failed to save payment:', err);
        this.toastService.error(err?.message ?? 'Failed to save payment');
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
