import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SalesInvoiceService, SalesInvoice, SalesInvoiceItem } from '../services/sales-invoice.service';
import { SalesOrderService, SalesOrder } from '../services/sales-order.service';
import { ToastService } from '../../../services/toast.service';
import { ApiService, Product } from '../../../services/api.service';

@Component({
  selector: 'app-sales-invoice-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sales-invoice-form.component.html',
  styleUrl: './sales-invoice-form.component.scss',
})
export class SalesInvoiceFormComponent implements OnInit {
  soForm!: FormGroup;
  invoiceId = signal<string | null>(null);
  mode = signal<'create' | 'edit' | 'preview'>('create');
  loading = signal(false);
  actionInProgress = signal(false);
  formSubmitted = signal(false);
  confirmedOrders = signal<SalesOrder[]>([]);

  // Customers data & selections
  customers = signal<any[]>([]);
  selectedCustomerId = signal<number | null>(null);
  selectedCustomerContacts = signal<any[]>([]);
  selectedCustomerAddresses = signal<any[]>([]);

  selectedContactName = signal<string>('');
  selectedBillingAddressName = signal<string>('');
  selectedDeliveryAddressName = signal<string>('');

  // Dropdown list constants
  statusOptions = ['UNPAID', 'PAID', 'DRAFT', 'CANCELLED'];
  shipViaOptions = ['', 'DHL', 'FedEx', 'UPS', 'Sea Freight', 'Air Freight', 'Road Transport'];
  fobOptions = ['', 'FOB Beijing', 'FOB Shanghai', 'FOB Shenzhen', 'EXW'];

  // Product picking modal details
  products = signal<Product[]>([]);
  productPickerOpen = signal(false);
  productSearch = signal('');
  activeLineIndex = signal<number | null>(null);

  // PDF Preview parameters
  pdfPreviewOpen = signal(false);
  pdfUrl = signal<SafeResourceUrl | null>(null);
  private pdfBlob: Blob | null = null;

  // Reactivity helper signals
  lineItemsValue = signal<any[]>([]);

  // Computed signals
  isPreviewMode = computed(() => this.mode() === 'preview');
  
  netAmount = computed(() => {
    let sum = 0;
    const items = this.lineItemsValue();
    items.forEach((i) => {
      const q = Number(i?.invoiceQty) || 0;
      const p = Number(i?.salesPrice) || 0;
      const d = Number(i?.discount) || 0;
      sum += q * p - d;
    });
    return sum;
  });

  totalAmount = computed(() => {
    const net = this.netAmount();
    const charge = Number(this.soForm?.get('deliveryCharge')?.value) || 0;
    const tax = Number(this.soForm?.get('tax')?.value) || 0;
    return net + charge + tax;
  });

  filteredProducts = computed(() => {
    const search = this.productSearch().toLowerCase().trim();
    const all = this.products();
    if (!search) return all;
    return all.filter(
      (p) =>
        (p.sku || '').toLowerCase().includes(search) ||
        (p.name || '').toLowerCase().includes(search) ||
        (p.category || '').toLowerCase().includes(search)
    );
  });

  get lineItems(): FormArray {
    return this.soForm.get('lineItems') as FormArray;
  }

  get lineItemIndices(): number[] {
    return Array.from({ length: this.lineItems.length }, (_, i) => i);
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly invoiceService: SalesInvoiceService,
    private readonly orderService: SalesOrderService,
    private readonly apiService: ApiService,
    private readonly toastService: ToastService,
    private readonly sanitizer: DomSanitizer
  ) {
    // Sync Reactivity array when LineItems value changes
    effect(() => {
      // Just to register dependency
      this.lineItemsValue();
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadCustomersAndProducts();
    this.loadConfirmedOrders();

    // Check mode and retrieve parameters
    const id = this.route.snapshot.paramMap.get('id');
    const path = this.route.snapshot.url.map((u) => u.path).join('/');
    
    if (id) {
      this.invoiceId.set(id);
      if (path.includes('preview')) {
        this.mode.set('preview');
      } else {
        this.mode.set('edit');
      }
    } else {
      this.mode.set('create');
      this.generateInvoiceNumber();
    }

    // Subscribe to form value modifications
    this.soForm.valueChanges.subscribe(() => {
      this.lineItemsValue.set(this.lineItems.value);
    });
  }

  private initForm(): void {
    const today = new Date().toISOString().substring(0, 10);
    this.soForm = this.fb.group({
      invoiceNo: ['', Validators.required],
      customerName: ['', Validators.required],
      customerId: [null],
      contactName: [''],
      contactPhone: [''],
      phone2: [''],
      phone3: [''],
      billingAddress: [''],
      deliveryAddress: [''],
      invoiceDate: [today, Validators.required],
      dueDate: [''],
      orderDate: [''],
      orderNo: [''],
      customerOrder: [''],
      shipVia: [''],
      shipReference: [''],
      shipDate: [''],
      fob: [''],
      shippingTerms: [''],
      status: ['UNPAID', Validators.required],
      accountPosting: [false],
      ediPosting: [false],
      deliveryCharge: [0],
      tax: [0],
      lineItems: this.fb.array([]),
    });
  }

  private loadCustomersAndProducts(): void {
    this.apiService.getOrganisations().subscribe({
      next: (res: any) => {
        if (res?.success && res.data) {
          const mapped = res.data.map((item: any) => ({
            id: item.id,
            name: item.customer_name,
            code: item.customer_code,
            phone: item.phone_number || '',
          }));
          this.customers.set(mapped);
          
          const id = this.invoiceId();
          if (id) {
            this.loadInvoiceDetails(id);
          }
        }
      },
      error: (err: any) => console.error('Failed to load customers:', err),
    });

    this.apiService.getProducts().subscribe({
      next: (res: any) => this.products.set(res || []),
      error: (err: any) => console.error('Failed to load products:', err),
    });
  }

  private loadConfirmedOrders(): void {
    this.orderService.getAll({ status: 'CONFIRMED' }).subscribe({
      next: (res) => {
        const confirmed = (res.data || []).filter(
          (ord) => ord.status === 'CONFIRMED'
        );
        this.confirmedOrders.set(confirmed);
      },
      error: (err: any) => console.error('Failed to load confirmed orders:', err),
    });
  }

  private generateInvoiceNumber(): void {
    this.invoiceService.generateInvoiceNo().subscribe({
      next: (res) => {
        if (res.invoiceNo) {
          this.soForm.patchValue({ invoiceNo: res.invoiceNo });
        }
      },
      error: (err) => console.error('Failed to generate sales invoice number:', err),
    });
  }

  private loadInvoiceDetails(id: string): void {
    this.loading.set(true);
    this.invoiceService.getOne(id).subscribe({
      next: (inv: any) => {
        const data = inv.data ?? inv;
        this.soForm.patchValue({
          invoiceNo: data.invoiceNo,
          customerName: data.customerName,
          customerId: data.customerId,
          contactName: data.contactName,
          contactPhone: data.contactPhone,
          phone2: data.phone2,
          phone3: data.phone3,
          billingAddress: data.billingAddress,
          deliveryAddress: data.deliveryAddress,
          invoiceDate: data.invoiceDate ? data.invoiceDate.split('T')[0] : '',
          dueDate: data.dueDate ? data.dueDate.split('T')[0] : '',
          orderDate: data.orderDate ? data.orderDate.split('T')[0] : '',
          orderNo: data.orderNo,
          customerOrder: data.customerOrder,
          shipVia: data.shipVia,
          shipReference: data.shipReference,
          shipDate: data.shipDate ? data.shipDate.split('T')[0] : '',
          fob: data.fob,
          shippingTerms: data.shippingTerms,
          status: data.status,
          accountPosting: data.accountPosting,
          ediPosting: data.ediPosting,
          deliveryCharge: Number(data.deliveryCharge) || 0,
          tax: Number(data.taxAmount) || 0,
        });

        this.selectedCustomerId.set(data.customerId || null);
        this.selectedContactName.set(data.contactName || '');
        this.selectedBillingAddressName.set('');
        this.selectedDeliveryAddressName.set('');

        // Populate Form Array
        while (this.lineItems.length) {
          this.lineItems.removeAt(0);
        }

        if (data.items && data.items.length > 0) {
          data.items.forEach((item: any) => {
            this.lineItems.push(
              this.fb.group({
                productCode: [item.productCode || ''],
                description: [item.description || '', Validators.required],
                size: [item.size || ''],
                finish: [item.finish || ''],
                packaging: [item.packaging || ''],
                weight: [Number(item.weight) || 0],
                orderQty: [Number(item.orderQty) || 0],
                invoiceQty: [Number(item.invoiceQty) || 0, [Validators.required, Validators.min(0.001)]],
                salesPrice: [Number(item.salesPrice) || 0, [Validators.required, Validators.min(0)]],
                discount: [Number(item.discount) || 0, [Validators.required, Validators.min(0)]],
              })
            );
          });
        }

        this.syncCustomerDetails();
        this.lineItemsValue.set(this.lineItems.value);
        if (this.isPreviewMode()) {
          this.soForm.disable();
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Failed to load Sales Invoice details:', err);
        this.toastService.error('Failed to load Sales Invoice details');
        this.loading.set(false);
      },
    });
  }

  private syncCustomerDetails(): void {
    const cid = this.selectedCustomerId();
    if (!cid || this.customers().length === 0) return;

    this.apiService.getOrganisationById(cid).subscribe({
      next: (res: any) => {
        if (res?.success && res.data) {
          const org = res.data;
          this.selectedCustomerContacts.set(org.contacts || []);
          this.selectedCustomerAddresses.set(org.addresses || []);

          // Find matches for display bindings
          const billingVal = this.soForm.get('billingAddress')?.value || '';
          const deliveryVal = this.soForm.get('deliveryAddress')?.value || '';

          const ba = (org.addresses || []).find((a: any) => a.address === billingVal || a.address_name === billingVal);
          if (ba) this.selectedBillingAddressName.set(ba.address_name);

          const da = (org.addresses || []).find((a: any) => a.address === deliveryVal || a.address_name === deliveryVal);
          if (da) this.selectedDeliveryAddressName.set(da.address_name);
        }
      },
      error: (err: any) => console.error('Failed to sync customer details:', err),
    });
  }

  onCustomerChange(e: any): void {
    const idStr = e.target.value;
    if (!idStr) {
      this.selectedCustomerId.set(null);
      this.selectedCustomerContacts.set([]);
      this.selectedCustomerAddresses.set([]);
      this.selectedContactName.set('');
      this.selectedBillingAddressName.set('');
      this.selectedDeliveryAddressName.set('');
      this.soForm.patchValue({
        customerName: '',
        billingAddress: '',
        deliveryAddress: '',
        contactName: '',
        contactPhone: '',
        phone2: '',
        phone3: '',
      });
      return;
    }

    const cid = Number(idStr);
    this.selectedCustomerId.set(cid);
    const customer = this.customers().find((c) => c.id === cid);
    if (customer) {
      this.soForm.patchValue({ customerName: customer.name });
      this.apiService.getOrganisationById(cid).subscribe({
        next: (res: any) => {
          if (res?.success && res.data) {
            const org = res.data;
            this.selectedCustomerContacts.set(org.contacts || []);
            this.selectedCustomerAddresses.set(org.addresses || []);
            
            if (org.contacts && org.contacts.length > 0) {
              const c = org.contacts[0];
              const cName = `${c.first_name} ${c.last_name || ''}`.trim();
              this.selectedContactName.set(cName);
              this.soForm.patchValue({
                contactName: cName,
                contactPhone: c.mobile_number || c.phone_number || '',
              });
            }
            if (org.addresses && org.addresses.length > 0) {
              const a = org.addresses[0];
              this.selectedBillingAddressName.set(a.address_name);
              this.soForm.patchValue({ billingAddress: a.address || '' });
            }
          }
        },
        error: (err: any) => console.error('Failed to load org details:', err),
      });
    }
  }

  onContactChange(e: any): void {
    const val = e.target.value;
    this.selectedContactName.set(val);
    this.soForm.patchValue({ contactName: val });

    const contact = this.selectedCustomerContacts().find(
      (c) => `${c.first_name} ${c.last_name || ''}`.trim() === val.trim()
    );
    if (contact) {
      this.soForm.patchValue({ contactPhone: contact.mobile_number || contact.phone_number || '' });
    } else {
      this.soForm.patchValue({ contactPhone: '' });
    }
  }

  onBillingAddressChange(e: any): void {
    const val = e.target.value;
    this.selectedBillingAddressName.set(val);
    const address = this.selectedCustomerAddresses().find((a) => a.address_name === val);
    if (address) {
      this.soForm.patchValue({ billingAddress: address.address || '' });
    } else {
      this.soForm.patchValue({ billingAddress: '' });
    }
  }

  onDeliveryAddressChange(e: any): void {
    const val = e.target.value;
    this.selectedDeliveryAddressName.set(val);
    const address = this.selectedCustomerAddresses().find((a) => a.address_name === val);
    if (address) {
      this.soForm.patchValue({ deliveryAddress: address.address || '' });
    } else {
      this.soForm.patchValue({ deliveryAddress: '' });
    }
  }

  onOrderChange(e: any): void {
    const orderNo = e.target.value;
    if (!orderNo) return;

    const ordSummary = this.confirmedOrders().find((o) => o.orderNo === orderNo);
    if (!ordSummary || !ordSummary.id) return;

    this.orderService.getOne(ordSummary.id).subscribe({
      next: (order) => {
        this.soForm.patchValue({
          orderDate: order.orderDate ? String(order.orderDate).split('T')[0] : '',
          customerName: order.customerName,
          contactName: order.contactName || '',
          contactPhone: order.contactPhone || '',
          phone2: order.phone2 || '',
          phone3: order.phone3 || '',
          billingAddress: order.billingAddress || '',
          deliveryAddress: order.deliveryAddress || '',
          customerOrder: order.customerOrder || '',
          deliveryCharge: Number(order.deliveryCharge) || 0,
          tax: Number(order.taxAmount) || 0,
          comments: order.notes || '',
        });

        this.selectedCustomerId.set(order.customerId || null);
        this.selectedContactName.set(order.contactName || '');

        // Fetch organization details to populate contacts/addresses signals
        if (order.customerId) {
          this.apiService.getOrganisationById(order.customerId).subscribe({
            next: (res: any) => {
              if (res?.success && res.data) {
                const org = res.data;
                this.selectedCustomerContacts.set(org.contacts || []);
                this.selectedCustomerAddresses.set(org.addresses || []);

                if (order.contactName) {
                  this.selectedContactName.set(order.contactName);
                }
                if (order.billingAddress) {
                  const matchingAddr = (org.addresses || []).find((a: any) => a.address === order.billingAddress);
                  if (matchingAddr) {
                    this.selectedBillingAddressName.set(matchingAddr.address_name);
                  }
                }
                if (order.deliveryAddress) {
                  const matchingAddr = (org.addresses || []).find((a: any) => a.address === order.deliveryAddress);
                  if (matchingAddr) {
                    this.selectedDeliveryAddressName.set(matchingAddr.address_name);
                  }
                }
              }
            },
            error: (err: any) => console.error('Failed to load org details:', err),
          });
        }

        // Clear existing line items
        while (this.lineItems.length) {
          this.lineItems.removeAt(0);
        }

        // Populate new items
        if (order.items && order.items.length > 0) {
          order.items.forEach((item) => {
            this.lineItems.push(
              this.fb.group({
                productCode: [item.productCode || ''],
                description: [item.description || '', Validators.required],
                size: [item.size || ''],
                finish: [item.finish || ''],
                packaging: [item.packaging || ''],
                weight: [Number(item.weight) || 0],
                orderQty: [Number(item.qty) || 0],
                invoiceQty: [Number(item.qty) || 0, [Validators.required, Validators.min(0.001)]],
                salesPrice: [Number(item.salePrice) || 0, [Validators.required, Validators.min(0)]],
                discount: [0, [Validators.required, Validators.min(0)]],
              })
            );
          });
        }
        this.lineItemsValue.set(this.lineItems.value);
      },
      error: (err) => {
        console.error('Failed to load sales order details:', err);
        this.toastService.error('Failed to load Sales Order details');
      }
    });
  }

  addLine(): void {
    this.lineItems.push(
      this.fb.group({
        productCode: [''],
        description: ['', Validators.required],
        size: [''],
        finish: [''],
        packaging: [''],
        weight: [0],
        orderQty: [0],
        invoiceQty: [1, [Validators.required, Validators.min(0.001)]],
        salesPrice: [0, [Validators.required, Validators.min(0)]],
        discount: [0, [Validators.required, Validators.min(0)]],
      })
    );
    this.lineItemsValue.set(this.lineItems.value);
  }

  removeLine(idx: number): void {
    this.lineItems.removeAt(idx);
    this.lineItemsValue.set(this.lineItems.value);
  }

  openProductPicker(idx: number): void {
    if (this.isPreviewMode()) return;
    this.activeLineIndex.set(idx);
    this.productSearch.set('');
    this.productPickerOpen.set(true);
  }

  closeProductPicker(): void {
    this.productPickerOpen.set(false);
    this.activeLineIndex.set(null);
  }

  selectProduct(p: Product): void {
    const idx = this.activeLineIndex();
    if (idx !== null && idx >= 0) {
      const row = this.lineItems.at(idx);
      row.patchValue({
        productCode: p.sku || '',
        description: p.name || '',
        size: (p as any).size || '',
        finish: (p as any).finish || '',
        packaging: (p as any).packaging || '',
        weight: Number(p.weight) || 0,
        salesPrice: Number(p.salePrice || p.unitPrice) || 0,
      });
      this.lineItemsValue.set(this.lineItems.value);
    }
    this.closeProductPicker();
  }

  onSave(): void {
    this.formSubmitted.set(true);
    if (this.soForm.invalid || !this.selectedCustomerId()) {
      this.toastService.error('Please fill all required fields.');
      this.soForm.markAllAsTouched();
      return;
    }

    const formValue = this.soForm.value;
    const payload: Partial<SalesInvoice> = {
      ...formValue,
      invoiceDate: this.normalizeRequiredDate(formValue.invoiceDate),
      dueDate: this.normalizeOptionalDate(formValue.dueDate),
      orderDate: this.normalizeOptionalDate(formValue.orderDate),
      shipDate: this.normalizeOptionalDate(formValue.shipDate),
      customerId: this.selectedCustomerId(),
      subtotal: this.netAmount(),
      taxAmount: Number(this.soForm.get('tax')?.value) || 0,
      totalAmount: this.totalAmount(),
      items: this.lineItems.value,
    };

    this.actionInProgress.set(true);
    const id = this.invoiceId();

    if (id) {
      this.invoiceService.update(id, payload).subscribe({
        next: () => {
          this.toastService.success('Sales Invoice updated successfully');
          this.actionInProgress.set(false);
          this.onClose();
        },
        error: (err: any) => {
          console.error('Failed to update Sales Invoice:', err);
          this.toastService.error(err.message || 'Failed to update Sales Invoice');
          this.actionInProgress.set(false);
        },
      });
    } else {
      this.invoiceService.create(payload).subscribe({
        next: () => {
          this.toastService.success('Sales Invoice created successfully');
          this.actionInProgress.set(false);
          this.onClose();
        },
        error: (err: any) => {
          console.error('Failed to create Sales Invoice:', err);
          this.toastService.error(err.message || 'Failed to create Sales Invoice');
          this.actionInProgress.set(false);
        },
      });
    }
  }

  onPreview(): void {
    const formValue = this.soForm.getRawValue();
    const payload: Partial<SalesInvoice> = {
      ...formValue,
      invoiceDate: this.normalizeRequiredDate(formValue.invoiceDate),
      dueDate: this.normalizeOptionalDate(formValue.dueDate),
      orderDate: this.normalizeOptionalDate(formValue.orderDate),
      shipDate: this.normalizeOptionalDate(formValue.shipDate),
      customerId: this.selectedCustomerId(),
      subtotal: this.netAmount(),
      taxAmount: Number(formValue.tax) || 0,
      totalAmount: this.totalAmount(),
      items: this.lineItems.getRawValue(),
    };

    this.invoiceService.getPreviewPdf(payload).subscribe({
      next: (blob) => {
        this.pdfBlob = blob;
        const rawUrl = window.URL.createObjectURL(blob);
        this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl));
        this.pdfPreviewOpen.set(true);
      },
      error: (err: any) => {
        console.error('PDF Preview failed:', err);
        this.toastService.error('Failed to generate PDF Preview');
      },
    });
  }

  closePdfPreview(): void {
    this.pdfPreviewOpen.set(false);
    if (this.pdfUrl()) {
      const url = this.pdfUrl() as any;
      if (url && url.changingThisBreaksApplicationSecurity) {
        window.URL.revokeObjectURL(url.changingThisBreaksApplicationSecurity);
      }
      this.pdfUrl.set(null);
    }
    this.pdfBlob = null;
  }

  downloadPdf(): void {
    if (this.pdfBlob) {
      const a = document.createElement('a');
      const url = window.URL.createObjectURL(this.pdfBlob);
      a.href = url;
      a.download = `${this.soForm.get('invoiceNo')?.value || 'invoice'}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      this.toastService.success('PDF download started');
    }
  }

  onClose(): void {
    this.router.navigate(['/sales/sales-invoice']);
  }

  private normalizeOptionalDate(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    const raw = String(value).trim();
    if (!raw) return null;
    if (raw.toLowerCase() === 'invalid date') return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : raw;
  }

  private normalizeRequiredDate(value: unknown): string {
    const normalized = this.normalizeOptionalDate(value);
    if (normalized) return normalized;
    return new Date().toISOString().substring(0, 10);
  }
}
