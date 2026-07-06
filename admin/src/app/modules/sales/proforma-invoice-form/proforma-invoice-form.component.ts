import { Component, OnInit, computed, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ProformaInvoiceService, ProformaInvoice } from '../services/proforma-invoice.service';
import { ApiService, Product } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-proforma-invoice-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './proforma-invoice-form.component.html',
  styleUrl: './proforma-invoice-form.component.scss'
})
export class ProformaInvoiceFormComponent implements OnInit {
  loading = signal(false);
  error = signal<string | null>(null);
  actionInProgress = signal(false);

  isEditMode = signal(false);
  isPreviewMode = signal(false);
  invoiceId = signal<string | number | null>(null);
  formSubmitted = signal(false);

  // PDF Preview state
  pdfPreviewOpen = signal(false);
  pdfUrl = signal<SafeResourceUrl | null>(null);
  pdfBlob = signal<Blob | null>(null);

  selectedCustomerId = signal<number | string>('');
  selectedContactName = signal<string>('');
  selectedBillingAddressName = signal<string>('');
  selectedDeliveryAddressName = signal<string>('');

  piForm: FormGroup;
  customers = signal<any[]>([]);
  selectedCustomerContacts = signal<any[]>([]);
  selectedCustomerAddresses = signal<any[]>([]);

  // Product picker
  products = signal<Product[]>([]);
  productSearch = signal('');
  productPickerOpen = signal(false);
  productPickerRowIndex = signal<number | null>(null);

  filteredProducts = computed(() => {
    const q = this.productSearch().toLowerCase().trim();
    if (!q) return this.products();
    return this.products().filter(p =>
      (p.sku || '').toLowerCase().includes(q) ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  });

  readonly statusOptions = ['DRAFT', 'OPEN', 'CONFIRMED', 'CANCELLED'];
  readonly typeOptions = ['NORMAL', 'PROFORMA'];

  get lineItems(): FormArray { return this.piForm.get('lineItems') as FormArray; }
  get lineItemIndices(): number[] { return Array.from({ length: this.lineItems?.length ?? 0 }, (_, i) => i); }

  lineItemsValue = signal<any[]>([]);
  taxValue = signal<number>(0);
  deliveryChargeValue = signal<number>(0);

  subtotal = computed(() => {
    return this.lineItemsValue().reduce((sum, item) => {
      const q = Number(item.qty) || 0;
      const p = Number(item.salePrice) || 0;
      return sum + q * p;
    }, 0);
  });

  netAmount = computed(() => this.subtotal());
  totalAmount = computed(() => this.subtotal() + this.deliveryChargeValue() + this.taxValue());

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly service: ProformaInvoiceService,
    private readonly apiService: ApiService,
    private readonly toastService: ToastService,
    private readonly sanitizer: DomSanitizer
  ) {
    this.piForm = this.fb.group({
      customerName: ['', [Validators.required]],
      contactName: [''],
      contactPhone: [''],
      phone2: [''],
      phone3: [''],
      billingAddress: [''],
      deliveryAddress: [''],
      invoiceNo: ['', Validators.required],
      invoiceDate: [this.todayStr(), Validators.required],
      dueDate: [this.todayStr()],
      customerOrder: [''],
      status: ['OPEN', Validators.required],
      invoiceType: ['NORMAL', Validators.required],
      deliveryCharge: [0, [Validators.min(0)]],
      tax: [0, [Validators.min(0)]],
      notes: [''],
      lineItems: this.fb.array([])
    });

    this.piForm.get('lineItems')?.valueChanges.subscribe(val => this.lineItemsValue.set(val || []));
    this.piForm.get('tax')?.valueChanges.subscribe(val => this.taxValue.set(Number(val) || 0));
    this.piForm.get('deliveryCharge')?.valueChanges.subscribe(val => this.deliveryChargeValue.set(Number(val) || 0));

    this.addLine();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.productPickerOpen.set(false); this.productPickerRowIndex.set(null); }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const url = this.router.url;

    if (idParam) {
      this.invoiceId.set(idParam);
      if (url.includes('/preview/')) this.isPreviewMode.set(true);
      else this.isEditMode.set(true);
    }

    // Load customers (all organisations)
    this.apiService.getOrganisations().subscribe({
      next: (res: any) => {
        if (res?.success && res.data) {
          const mapped = res.data.map((item: any) => ({
            id: item.id,
            name: item.customer_name,
            code: item.customer_code,
            phone: item.phone_number || ''
          }));
          this.customers.set(mapped);
          if (idParam) this.loadInvoice(idParam);
        }
      },
      error: (err: any) => console.error('Failed to load customers:', err)
    });

    // Load products
    this.apiService.getProducts().subscribe({
      next: (products: any) => this.products.set(products),
      error: (err: any) => console.error('Failed to load products:', err)
    });

    // Auto-generate number for new invoice
    if (!idParam) {
      this.service.generateInvoiceNo().subscribe({
        next: (res: any) => { if (res?.invoiceNo) this.piForm.patchValue({ invoiceNo: res.invoiceNo }); },
        error: () => this.piForm.patchValue({ invoiceNo: `PI-${this.buildFallbackNo()}` })
      });
    }
  }

  loadInvoice(id: string | number): void {
    this.loading.set(true);
    this.service.getOne(id).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        const data = res?.data ?? res;
        if (!data) return;

        while (this.lineItems.length > 0) this.lineItems.removeAt(0);

        this.piForm.patchValue({
          customerName: data.customerName || '',
          contactName: data.contactName || '',
          contactPhone: data.contactPhone || '',
          phone2: data.phone2 || '',
          phone3: data.phone3 || '',
          billingAddress: data.billingAddress || '',
          deliveryAddress: data.deliveryAddress || '',
          invoiceNo: data.invoiceNo || '',
          invoiceDate: data.invoiceDate ? data.invoiceDate.split('T')[0] : this.todayStr(),
          dueDate: data.dueDate ? data.dueDate.split('T')[0] : this.todayStr(),
          customerOrder: data.customerOrder || '',
          status: data.status || 'OPEN',
          invoiceType: data.invoiceType || 'NORMAL',
          deliveryCharge: data.deliveryCharge || 0,
          tax: data.taxAmount || 0,
          notes: data.notes || ''
        });

        const items = data.items || [];
        if (items.length > 0) items.forEach((item: any) => this.addLine(item));
        else this.addLine();

        const customer = this.customers().find(c => c.name === data.customerName);
        if (customer) {
          this.selectedCustomerId.set(customer.id);
          this.apiService.getOrganisationById(customer.id).subscribe({
            next: (orgRes: any) => {
              if (orgRes?.success && orgRes.data) {
                const org = orgRes.data;
                this.selectedCustomerContacts.set(org.contacts || []);
                this.selectedCustomerAddresses.set(org.addresses || []);
                this.selectedContactName.set(data.contactName || '');
                const ba = (org.addresses || []).find((a: any) => a.address === data.billingAddress || a.address_name === data.billingAddress);
                if (ba) this.selectedBillingAddressName.set(ba.address_name);
                const da = (org.addresses || []).find((a: any) => a.address === data.deliveryAddress || a.address_name === data.deliveryAddress);
                if (da) this.selectedDeliveryAddressName.set(da.address_name);
              }
              if (this.isPreviewMode()) this.piForm.disable();
            }
          });
        } else {
          if (this.isPreviewMode()) this.piForm.disable();
        }
      },
      error: (err: any) => {
        this.loading.set(false);
        this.error.set('Failed to load proforma invoice: ' + (err.message || ''));
      }
    });
  }

  onCustomerChange(event: Event): void {
    const idStr = (event.target as HTMLSelectElement).value;
    this.selectedCustomerId.set(idStr);
    if (!idStr) {
      this.piForm.patchValue({ customerName: '', contactName: '', contactPhone: '', billingAddress: '' });
      this.selectedCustomerContacts.set([]); this.selectedCustomerAddresses.set([]);
      this.selectedContactName.set(''); this.selectedBillingAddressName.set(''); this.selectedDeliveryAddressName.set('');
      return;
    }
    const cid = Number(idStr);
    const customer = this.customers().find(c => c.id === cid);
    if (customer) {
      this.piForm.patchValue({ customerName: customer.name });
      this.apiService.getOrganisationById(cid).subscribe({
        next: (res: any) => {
          if (res?.success && res.data) {
            const org = res.data;
            this.selectedCustomerContacts.set(org.contacts || []);
            this.selectedCustomerAddresses.set(org.addresses || []);
            if (org.contacts?.length > 0) {
              const c = org.contacts[0];
              this.selectedContactName.set((c.first_name + ' ' + (c.last_name || '')).trim());
              this.piForm.patchValue({ contactName: this.selectedContactName(), contactPhone: c.mobile_number || c.phone_number || '' });
            }
            if (org.addresses?.length > 0) {
              const a = org.addresses[0];
              this.selectedBillingAddressName.set(a.address_name);
              this.piForm.patchValue({ billingAddress: a.address });
            }
          }
        },
        error: (err: any) => console.error('Failed to load org details:', err)
      });
    }
  }

  onContactChange(event: Event): void {
    const name = (event.target as HTMLSelectElement).value;
    this.selectedContactName.set(name);
    const c = this.selectedCustomerContacts().find(c => (c.first_name + ' ' + (c.last_name || '')).trim() === name.trim());
    if (c) this.piForm.patchValue({ contactPhone: c.mobile_number || c.phone_number || '' });
    else this.piForm.patchValue({ contactPhone: '' });
  }

  onBillingAddressChange(event: Event): void {
    const name = (event.target as HTMLSelectElement).value;
    this.selectedBillingAddressName.set(name);
    const a = this.selectedCustomerAddresses().find(a => a.address_name === name);
    if (a) this.piForm.patchValue({ billingAddress: a.address });
    else this.piForm.patchValue({ billingAddress: '' });
  }

  onDeliveryAddressChange(event: Event): void {
    const name = (event.target as HTMLSelectElement).value;
    this.selectedDeliveryAddressName.set(name);
    const a = this.selectedCustomerAddresses().find(a => a.address_name === name);
    if (a) this.piForm.patchValue({ deliveryAddress: a.address });
    else this.piForm.patchValue({ deliveryAddress: '' });
  }

  openProductPicker(index: number): void {
    if (this.isPreviewMode()) return;
    this.productPickerRowIndex.set(index);
    this.productSearch.set('');
    this.productPickerOpen.set(true);
  }

  closeProductPicker(): void { this.productPickerOpen.set(false); this.productPickerRowIndex.set(null); }

  selectProduct(p: Product): void {
    const idx = this.productPickerRowIndex();
    if (idx !== null && idx >= 0 && idx < this.lineItems.length) {
      const row = this.lineItems.at(idx) as FormGroup;
      row.patchValue({
        productCode: p.sku || '',
        description: p.name || '',
        size: (p as any).size || '',
        finish: (p as any).finish || '',
        packaging: (p as any).packaging || '',
        qty: 1,
        salePrice: p.salePrice || p.unitPrice || 0,
        totalPrice: p.salePrice || p.unitPrice || 0
      });
      this.recalculateRow(idx);
    }
    this.closeProductPicker();
  }

  recalculateRow(index: number): void {
    const row = this.lineItems.at(index) as FormGroup;
    const qty = Number(row.get('qty')?.value) || 0;
    const salePrice = Number(row.get('salePrice')?.value) || 0;
    const totalPrice = qty * salePrice;
    row.patchValue({ totalPrice }, { emitEvent: false });
    this.piForm.get('lineItems')?.updateValueAndValidity({ emitEvent: true });
  }

  addLine(item?: any): void {
    const row = this.fb.group({
      productCode: [item?.productCode || ''],
      description: [item?.description || '', Validators.required],
      size: [item?.size || ''],
      finish: [item?.finish || ''],
      packaging: [item?.packaging || ''],
      boxQty: [item?.boxQty || 0],
      outerQty: [item?.outerQty || 0],
      palletQty: [item?.palletQty || 0],
      weight: [item?.weight || 0],
      qty: [item?.qty || 1, [Validators.required, Validators.min(0.001)]],
      salePrice: [item?.salePrice || 0, [Validators.required, Validators.min(0)]],
      totalPrice: [item?.totalPrice || 0]
    });

    row.valueChanges.subscribe(() => {
      const idx = this.lineItems.controls.indexOf(row);
      if (idx !== -1) this.recalculateRow(idx);
    });

    this.lineItems.push(row);
  }

  removeLine(index: number): void {
    if (this.lineItems.length > 1) this.lineItems.removeAt(index);
    else this.toastService.warning('At least one line item is required');
  }
  onSave(): void {
    this.formSubmitted.set(true);
    if (this.piForm.invalid) {
      this.piForm.markAllAsTouched();
      this.toastService.error('Please fill all required fields');
      return;
    }
    const formVal = this.piForm.value;
    const payload: Partial<ProformaInvoice> = {
      invoiceNo: formVal.invoiceNo,
      customerName: formVal.customerName,
      customerId: this.selectedCustomerId() ? Number(this.selectedCustomerId()) : undefined,
      contactName: formVal.contactName,
      contactPhone: formVal.contactPhone,
      phone2: formVal.phone2,
      phone3: formVal.phone3,
      billingAddress: formVal.billingAddress,
      deliveryAddress: formVal.deliveryAddress,
      invoiceDate: formVal.invoiceDate,
      dueDate: formVal.dueDate || undefined,
      customerOrder: formVal.customerOrder,
      status: formVal.status,
      invoiceType: formVal.invoiceType,
      deliveryCharge: Number(formVal.deliveryCharge) || 0,
      subtotal: this.subtotal(),
      taxAmount: this.taxValue(),
      totalAmount: this.totalAmount(),
      notes: formVal.notes,
      items: formVal.lineItems.map((item: any) => ({
        productCode: item.productCode,
        description: item.description,
        size: item.size,
        finish: item.finish,
        packaging: item.packaging,
        boxQty: Number(item.boxQty) || 0,
        outerQty: Number(item.outerQty) || 0,
        palletQty: Number(item.palletQty) || 0,
        weight: Number(item.weight) || 0,
        qty: Number(item.qty) || 1,
        salePrice: Number(item.salePrice) || 0,
        totalPrice: Number(item.totalPrice) || 0
      }))
    };

    this.actionInProgress.set(true);
    const id = this.invoiceId();

    if (this.isEditMode() && id) {
      this.service.update(id, payload).subscribe({
        next: () => { this.toastService.success('Proforma Invoice updated'); this.router.navigate(['/sales/proforma-invoice']); },
        error: (err: any) => { this.actionInProgress.set(false); this.toastService.error(err.message || 'Failed to update'); }
      });
    } else {
      this.service.create(payload).subscribe({
        next: () => { this.toastService.success('Proforma Invoice created'); this.router.navigate(['/sales/proforma-invoice']); },
        error: (err: any) => { this.actionInProgress.set(false); this.toastService.error(err.message || 'Failed to create'); }
      });
    }
  }

  onClose(): void { this.router.navigate(['/sales/proforma-invoice']); }
  onPreview(): void {
    this.formSubmitted.set(true);
    if (this.piForm.invalid) {
      this.piForm.markAllAsTouched();
      this.toastService.error('Please fill all required fields before previewing');
      return;
    }
    const formVal = this.piForm.value;
    const payload: Partial<ProformaInvoice> = {
      invoiceNo: formVal.invoiceNo,
      customerName: formVal.customerName,
      customerId: this.selectedCustomerId() ? Number(this.selectedCustomerId()) : undefined,
      contactName: formVal.contactName,
      contactPhone: formVal.contactPhone,
      phone2: formVal.phone2,
      phone3: formVal.phone3,
      billingAddress: formVal.billingAddress,
      deliveryAddress: formVal.deliveryAddress,
      invoiceDate: formVal.invoiceDate,
      dueDate: formVal.dueDate || undefined,
      customerOrder: formVal.customerOrder,
      status: formVal.status,
      invoiceType: formVal.invoiceType,
      deliveryCharge: Number(formVal.deliveryCharge) || 0,
      subtotal: this.subtotal(),
      taxAmount: this.taxValue(),
      totalAmount: this.totalAmount(),
      notes: formVal.notes,
      items: formVal.lineItems.map((item: any) => ({
        productCode: item.productCode,
        description: item.description,
        size: item.size,
        finish: item.finish,
        packaging: item.packaging,
        boxQty: Number(item.boxQty) || 0,
        outerQty: Number(item.outerQty) || 0,
        palletQty: Number(item.palletQty) || 0,
        weight: Number(item.weight) || 0,
        qty: Number(item.qty) || 1,
        salePrice: Number(item.salePrice) || 0,
        totalPrice: Number(item.totalPrice) || 0
      }))
    };

    this.loading.set(true);
    this.service.getPreviewPdf(payload).subscribe({
      next: (blob: Blob) => {
        this.loading.set(false);
        this.pdfBlob.set(blob);
        const objectUrl = URL.createObjectURL(blob);
        this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl));
        this.pdfPreviewOpen.set(true);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.toastService.error(err.message || 'Failed to generate PDF preview');
      }
    });
  }

  downloadPdf(): void {
    const blob = this.pdfBlob();
    if (!blob) return;
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `sales-acknowledgment-${this.piForm.get('invoiceNo')?.value || 'invoice'}.pdf`;
    a.click();
    URL.revokeObjectURL(objectUrl);
  }

  closePdfPreview(): void {
    this.pdfPreviewOpen.set(false);
    this.pdfUrl.set(null);
    this.pdfBlob.set(null);
  }

  private todayStr(): string { return new Date().toISOString().split('T')[0]; }

  private buildFallbackNo(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return `${yy}${mm}-${Math.floor(10 + Math.random() * 90)}`;
  }
}
