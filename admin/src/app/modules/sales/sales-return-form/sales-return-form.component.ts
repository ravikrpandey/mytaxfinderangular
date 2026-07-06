import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SalesReturnService, SalesReturn, SalesReturnItem } from '../services/sales-return.service';
import { SalesInvoiceService, SalesInvoice } from '../services/sales-invoice.service';
import { ToastService } from '../../../services/toast.service';
import { ApiService } from '../../../services/api.service';

interface CustomerLookup {
  id: number;
  name: string;
  code: string;
  phone: string;
}

interface Product {
  id: number;
  sku: string;
  name: string;
  weight?: number;
  salePrice?: number;
  unitPrice?: number;
  size?: string;
  finish?: string;
  packaging?: string;
}

@Component({
  selector: 'app-sales-return-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './sales-return-form.component.html',
  styleUrl: './sales-return-form.component.scss',
})
export class SalesReturnFormComponent implements OnInit {
  soForm!: FormGroup;
  formSubmitted = signal(false);
  customers = signal<CustomerLookup[]>([]);
  products = signal<Product[]>([]);
  loading = signal(true);
  actionInProgress = signal(false);
  isPreviewMode = signal(false);
  returnId = signal<number | null>(null);

  // Bindings for dropdown popups
  selectedCustomerId = signal<number | null>(null);
  selectedCustomerContacts = signal<any[]>([]);
  selectedCustomerAddresses = signal<any[]>([]);
  selectedContactName = signal<string>('');
  selectedBillingAddressName = signal<string>('');
  selectedDeliveryAddressName = signal<string>('');

  // Line item change tracker signal
  lineItemsValue = signal<any[]>([]);

  // Product picker states
  productPickerOpen = signal(false);
  activeLineIndex = signal<number | null>(null);
  productSearch = signal<string>('');

  // PDF Preview states
  pdfPreviewOpen = signal(false);
  confirmedInvoices = signal<SalesInvoice[]>([]);
  pdfUrl = signal<SafeResourceUrl | null>(null);
  private pdfBlob: Blob | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly returnService: SalesReturnService,
    private readonly invoiceService: SalesInvoiceService,
    private readonly toastService: ToastService,
    private readonly apiService: ApiService,
    private readonly sanitizer: DomSanitizer
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const path = this.route.snapshot.url.map(segment => segment.path).join('/');
    
    if (path.includes('preview')) {
      this.isPreviewMode.set(true);
    }

    this.loadCustomers();
    this.loadProducts();
    this.loadConfirmedInvoices();

    if (idParam) {
      this.returnId.set(Number(idParam));
      this.loadReturnDetails(Number(idParam));
    } else {
      this.generateReturnNumber();
      this.addLine();
      this.loading.set(false);
    }
  }

  private initForm(): void {
    this.soForm = this.fb.group({
      customerName: ['', Validators.required],
      contactName: [''],
      contactPhone: [''],
      phone2: [''],
      phone3: [''],
      billingAddress: [''],
      deliveryAddress: [''],
      returnDate: [new Date().toISOString().split('T')[0], Validators.required],
      returnNo: ['', Validators.required],
      customerRef: [''],
      salesInvoice: [''],
      status: ['DRAFT', Validators.required],
      deliveryCharge: [0, [Validators.required, Validators.min(0)]],
      tax: [0, [Validators.required, Validators.min(0)]],
      comments: [''],
      lineItems: this.fb.array([]),
    });

    this.soForm.valueChanges.subscribe(() => {
      this.lineItemsValue.set(this.lineItems.value);
    });
  }

  get lineItems(): FormArray {
    return this.soForm.get('lineItems') as FormArray;
  }

  get lineItemIndices(): number[] {
    return Array.from({ length: this.lineItems.length }, (_, i) => i);
  }

  filteredProducts = computed(() => {
    const query = this.productSearch().toLowerCase().trim();
    if (!query) return this.products();
    return this.products().filter(
      (p) =>
        (p.sku || '').toLowerCase().includes(query) ||
        (p.name || '').toLowerCase().includes(query)
    );
  });

  netAmount = computed(() => {
    const items = this.lineItemsValue();
    return items.reduce((sum, item) => {
      const q = Number(item.returnQty) || 0;
      const rate = Number(item.salesPrice) || 0;
      const discount = Number(item.discount) || 0;
      return sum + (q * rate - discount);
    }, 0);
  });

  totalAmount = computed(() => {
    const delivery = Number(this.soForm.get('deliveryCharge')?.value) || 0;
    const tax = Number(this.soForm.get('tax')?.value) || 0;
    return this.netAmount() + delivery + tax;
  });

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
          this.syncCustomerDetails();
        }
      },
      error: (err) => console.error('Failed to load customer organizations:', err),
    });
  }

  loadProducts(): void {
    this.apiService.getProducts().subscribe({
      next: (res: any) => {
        this.products.set(res || []);
      },
      error: (err) => console.error('Failed to load products:', err),
    });
  }

  loadConfirmedInvoices(): void {
    this.invoiceService.getAll().subscribe({
      next: (res) => {
        const confirmed = (res.data || []).filter(
          (inv) => inv.status === 'UNPAID' || inv.status === 'PAID'
        );
        this.confirmedInvoices.set(confirmed);
      },
      error: (err) => console.error('Failed to load confirmed invoices:', err),
    });
  }

  generateReturnNumber(): void {
    this.returnService.generateReturnNo().subscribe({
      next: (res) => {
        if (res && res.returnNo) {
          this.soForm.patchValue({ returnNo: res.returnNo });
        }
      },
      error: (err) => console.error('Failed to generate return number:', err),
    });
  }

  loadReturnDetails(id: number): void {
    this.loading.set(true);
    this.returnService.getOne(id).subscribe({
      next: (data) => {
        this.soForm.patchValue({
          customerName: data.customerName,
          contactName: data.contactName,
          contactPhone: data.contactPhone,
          phone2: data.phone2,
          phone3: data.phone3,
          billingAddress: data.billingAddress,
          deliveryAddress: data.deliveryAddress,
          returnDate: data.returnDate ? data.returnDate.split('T')[0] : '',
          returnNo: data.returnNo,
          customerRef: data.customerRef,
          salesInvoice: data.salesInvoice,
          status: data.status,
          deliveryCharge: Number(data.deliveryCharge) || 0,
          tax: Number(data.taxAmount) || 0,
          comments: data.comments,
        });

        this.selectedCustomerId.set(data.customerId || null);
        this.selectedContactName.set(data.contactName || '');
        this.selectedBillingAddressName.set('');
        this.selectedDeliveryAddressName.set('');

        while (this.lineItems.length) {
          this.lineItems.removeAt(0);
        }

        if (data.salesInvoice) {
          this.returnService.getAlreadyReturnedQty(data.salesInvoice).subscribe({
            next: (alreadyReturnedMap) => {
              if (data.items && data.items.length > 0) {
                data.items.forEach((item: any) => {
                  const returned = Number(alreadyReturnedMap[item.productCode]) || 0;
                  const currentReturnQty = Number(item.returnQty) || 0;
                  const returnedFromOthers = Math.max(0, returned - currentReturnQty);
                  const remaining = Math.max(0, (Number(item.invoiceQty) || 0) - returnedFromOthers);

                  this.lineItems.push(
                    this.fb.group({
                      productCode: [item.productCode || ''],
                      description: [item.description || '', Validators.required],
                      size: [item.size || ''],
                      finish: [item.finish || ''],
                      packaging: [item.packaging || ''],
                      weight: [Number(item.weight) || 0],
                      orderQty: [Number(item.orderQty) || 0],
                      invoiceQty: [Number(item.invoiceQty) || 0],
                      remainingQty: [remaining],
                      returnQty: [currentReturnQty, [Validators.required, Validators.min(0), Validators.max(remaining)]],
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
            error: (err) => {
              console.error('Failed to get already returned qty in load:', err);
              this.loadLineItemsSimple(data.items || []);
              this.syncCustomerDetails();
              this.loading.set(false);
            }
          });
        } else {
          this.loadLineItemsSimple(data.items || []);
          this.syncCustomerDetails();
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Failed to load Sales Return details:', err);
        this.toastService.error('Failed to load Sales Return details');
        this.loading.set(false);
      },
    });
  }

  private loadLineItemsSimple(items: any[]): void {
    if (items && items.length > 0) {
      items.forEach((item: any) => {
        this.lineItems.push(
          this.fb.group({
            productCode: [item.productCode || ''],
            description: [item.description || '', Validators.required],
            size: [item.size || ''],
            finish: [item.finish || ''],
            packaging: [item.packaging || ''],
            weight: [Number(item.weight) || 0],
            orderQty: [Number(item.orderQty) || 0],
            invoiceQty: [Number(item.invoiceQty) || 0],
            remainingQty: [Number(item.invoiceQty) || 0],
            returnQty: [Number(item.returnQty) || 1, [Validators.required, Validators.min(0)]],
            salesPrice: [Number(item.salesPrice) || 0, [Validators.required, Validators.min(0)]],
            discount: [Number(item.discount) || 0, [Validators.required, Validators.min(0)]],
          })
        );
      });
    }
    this.lineItemsValue.set(this.lineItems.value);
    if (this.isPreviewMode()) {
      this.soForm.disable();
    }
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

  onInvoiceChange(e: any): void {
    const invoiceNo = e.target.value;
    if (!invoiceNo) {
      return;
    }

    const inv = this.confirmedInvoices().find((i) => i.invoiceNo === invoiceNo);
    if (!inv) return;

    // Auto-populate customer fields
    this.soForm.patchValue({
      customerName: inv.customerName,
      contactName: inv.contactName || '',
      contactPhone: inv.contactPhone || '',
      phone2: inv.phone2 || '',
      phone3: inv.phone3 || '',
      billingAddress: inv.billingAddress || '',
      deliveryAddress: inv.deliveryAddress || '',
    });

    this.selectedCustomerId.set(inv.customerId || null);
    this.selectedContactName.set(inv.contactName || '');
    
    // Clear and reload Contacts & Addresses signals
    if (inv.customerId) {
      this.apiService.getOrganisationById(inv.customerId).subscribe({
        next: (res: any) => {
          if (res?.success && res.data) {
            const org = res.data;
            this.selectedCustomerContacts.set(org.contacts || []);
            this.selectedCustomerAddresses.set(org.addresses || []);
            
            // Sync specific selected names if they match
            if (inv.contactName) {
              this.selectedContactName.set(inv.contactName);
            }
            if (inv.billingAddress) {
              const matchingAddr = (org.addresses || []).find((a: any) => a.address === inv.billingAddress);
              if (matchingAddr) {
                this.selectedBillingAddressName.set(matchingAddr.address_name);
              }
            }
            if (inv.deliveryAddress) {
              const matchingAddr = (org.addresses || []).find((a: any) => a.address === inv.deliveryAddress);
              if (matchingAddr) {
                this.selectedDeliveryAddressName.set(matchingAddr.address_name);
              }
            }
          }
        },
        error: (err: any) => console.error('Failed to load org details:', err),
      });
    }

    // Load already returned quantities to subtract
    this.returnService.getAlreadyReturnedQty(inv.invoiceNo).subscribe({
      next: (alreadyReturnedMap) => {
        // Clear line items
        while (this.lineItems.length) {
          this.lineItems.removeAt(0);
        }

        if (inv.items && inv.items.length > 0) {
          inv.items.forEach((item: any) => {
            const returned = Number(alreadyReturnedMap[item.productCode]) || 0;
            const remaining = Math.max(0, Number(item.invoiceQty) - returned);

            this.lineItems.push(
              this.fb.group({
                productCode: [item.productCode || ''],
                description: [item.description || '', Validators.required],
                size: [item.size || ''],
                finish: [item.finish || ''],
                packaging: [item.packaging || ''],
                weight: [Number(item.weight) || 0],
                orderQty: [Number(item.orderQty) || 0],
                invoiceQty: [Number(item.invoiceQty) || 0],
                remainingQty: [remaining],
                returnQty: [remaining > 0 ? remaining : 0, [Validators.required, Validators.min(0), Validators.max(remaining)]],
                salesPrice: [Number(item.salesPrice) || 0, [Validators.required, Validators.min(0)]],
                discount: [Number(item.discount) || 0, [Validators.required, Validators.min(0)]],
              })
            );
          });
        }
        this.lineItemsValue.set(this.lineItems.value);
      },
      error: (err) => {
        console.error('Failed to get already returned quantities:', err);
        this.toastService.error('Failed to load invoice returned quantities');
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
        invoiceQty: [0],
        remainingQty: [0],
        returnQty: [1, [Validators.required, Validators.min(0.001)]],
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

    const payload: Partial<SalesReturn> = {
      ...this.soForm.value,
      customerId: this.selectedCustomerId(),
      subtotal: this.netAmount(),
      taxAmount: Number(this.soForm.get('tax')?.value) || 0,
      totalAmount: this.totalAmount(),
      items: this.lineItems.value,
    };

    this.actionInProgress.set(true);
    const id = this.returnId();

    if (id) {
      this.returnService.update(id, payload).subscribe({
        next: () => {
          this.toastService.success('Sales Return updated successfully');
          this.actionInProgress.set(false);
          this.onClose();
        },
        error: (err: any) => {
          console.error('Failed to update Sales Return:', err);
          this.toastService.error(err.message || 'Failed to update Sales Return');
          this.actionInProgress.set(false);
        },
      });
    } else {
      this.returnService.create(payload).subscribe({
        next: () => {
          this.toastService.success('Sales Return created successfully');
          this.actionInProgress.set(false);
          this.onClose();
        },
        error: (err: any) => {
          console.error('Failed to create Sales Return:', err);
          this.toastService.error(err.message || 'Failed to create Sales Return');
          this.actionInProgress.set(false);
        },
      });
    }
  }

  onPreview(): void {
    this.formSubmitted.set(true);
    if (this.soForm.invalid || !this.selectedCustomerId()) {
      this.toastService.error('Please fill all required fields before previewing.');
      this.soForm.markAllAsTouched();
      return;
    }

    const payload: Partial<SalesReturn> = {
      ...this.soForm.getRawValue(),
      customerId: this.selectedCustomerId(),
      subtotal: this.netAmount(),
      taxAmount: Number(this.soForm.getRawValue().tax) || 0,
      totalAmount: this.totalAmount(),
      items: this.lineItems.getRawValue(),
    };

    this.returnService.getPreviewPdf(payload).subscribe({
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
      a.download = `${this.soForm.get('returnNo')?.value || 'sales_return'}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      this.toastService.success('PDF download started');
    }
  }

  onClose(): void {
    this.router.navigate(['/sales/return']);
  }
}
