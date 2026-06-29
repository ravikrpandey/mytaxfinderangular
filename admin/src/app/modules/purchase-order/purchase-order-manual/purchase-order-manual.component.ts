import { Component, OnInit, computed, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { PurchaseOrderService, PurchaseOrderStatus } from '../services/purchase-order.service';
import { ApiService, Product } from '../../../services/api.service';

@Component({
  selector: 'app-purchase-order-manual',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './purchase-order-manual.component.html',
  styleUrl: './purchase-order-manual.component.scss'
})
export class PurchaseOrderManualComponent implements OnInit {
  loading = signal(false);
  error = signal<string | null>(null);
  actionInProgress = signal(false);

  isEditMode = signal(false);
  isPreviewMode = signal(false);
  poId = signal<string | number | null>(null);

  selectedSupplierId = signal<number | string>('');
  selectedContactName = signal<string>('');
  selectedAddressName = signal<string>('');

  poForm: FormGroup;
  readonly statusOptions: PurchaseOrderStatus[] = ['draft', 'pending', 'approved', 'rejected'];
  readonly currencyOptions = ['INR - Indian Rupee', 'Pound Sterling - GBP', 'US Dollar - USD', 'Euro - EUR'];

  suppliers = signal<any[]>([]);
  selectedSupplierContacts = signal<any[]>([]);
  selectedSupplierAddresses = signal<any[]>([]);

  // Product picker state
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

  get lineItems(): FormArray {
    return this.poForm.get('lineItems') as FormArray;
  }

  get lineItemIndices(): number[] {
    const len = this.lineItems?.length ?? 0;
    return Array.from({ length: len }, (_, i) => i);
  }

  lineItemsValue = signal<any[]>([]);
  taxValue = signal<number>(0);

  subtotal = computed(() => {
    const items = this.lineItemsValue();
    return items.reduce((sum, item) => {
      const q = Number(item.quantity) || 0;
      const u = Number(item.unitPrice) || 0;
      return sum + q * u;
    }, 0);
  });

  total = computed(() => {
    return this.subtotal() + this.taxValue();
  });

  landedAmount = computed(() => this.total());

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly apiService: ApiService
  ) {
    this.poForm = this.fb.group({
      vendorName: ['', [Validators.required]],
      contactName: [''],
      contactPhone: [''],
      vendorAddress: [''],
      vendorPhone: [''],
      vendorGSTIN: ['', [Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i)]],
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

    // Track value changes for dynamic calculations
    this.poForm.get('lineItems')?.valueChanges.subscribe((val) => {
      this.lineItemsValue.set(val || []);
    });
    this.poForm.get('tax')?.valueChanges.subscribe((val) => {
      this.taxValue.set(Number(val) || 0);
    });

    this.addLine();
  }

  @HostListener('document:keydown.escape')
  closeProductPickerOnEscape(): void {
    this.productPickerOpen.set(false);
    this.productPickerRowIndex.set(null);
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const url = this.router.url;

    if (idParam) {
      this.poId.set(idParam);
      if (url.includes('/preview/')) {
        this.isPreviewMode.set(true);
      } else {
        this.isEditMode.set(true);
      }
    }

    this.apiService.getOrganisations().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const filtered = res.data.filter((item: any) => {
            const type = item.customer_type_names || (item.customerType ? item.customerType.list_name : '');
            return type.toUpperCase().includes('SUPPLIER');
          }).map((item: any) => ({
            id: item.id,
            name: item.customer_name,
            code: item.customer_code,
            taxNo: item.tax_registeration_number || '',
            phone: item.phone_number || ''
          }));
          this.suppliers.set(filtered);

          const poIdVal = this.poId();
          if (poIdVal) {
            this.loadPurchaseOrder(poIdVal);
          }
        }
      },
      error: (err) => {
        console.error('Failed to load suppliers:', err);
      }
    });

    // Load products for the product picker
    this.apiService.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
      },
      error: (err) => {
        console.error('Failed to load products for picker:', err);
      }
    });

    if (!idParam) {
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
  }

  loadPurchaseOrder(id: string | number): void {
    this.loading.set(true);
    this.purchaseOrderService.getOne(id).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res) {
          // Clear lineItems FormArray
          while (this.lineItems.length > 0) {
            this.lineItems.removeAt(0);
          }

          // Populate fields
          this.poForm.patchValue({
            vendorName: res.vendorName || '',
            contactName: res.contactName || '',
            contactPhone: res.contactPhone || '',
            vendorAddress: res.vendorAddress || '',
            vendorPhone: res.vendorPhone || '',
            vendorGSTIN: res.vendorGSTIN || '',
            supplierReference: res.supplierReference || '',
            status: res.status || 'draft',
            currency: res.currency || 'Pound Sterling - GBP',
            exchangeRate: res.exchangeRate || 1,
            comments: res.comments || res.notes || '',
            orderNumber: res.orderNumber || res.poNumber || '',
            orderDate: res.orderDate ? res.orderDate.split('T')[0] : this.todayDateString(),
            tax: res.taxAmount || res.tax || 0
          });

          // Add line items
          const items = res.items || [];
          if (items.length > 0) {
            items.forEach((item: any) => {
              this.addLine(item);
            });
          } else {
            this.addLine();
          }

          // Find the supplier and load its details to populate the contacts & addresses dropdowns
          const supplier = this.suppliers().find(s => s.name === res.vendorName);
          if (supplier) {
            this.selectedSupplierId.set(supplier.id);

            // Fetch supplier contacts and addresses
            this.apiService.getOrganisationById(supplier.id).subscribe({
              next: (orgRes) => {
                if (orgRes && orgRes.success && orgRes.data) {
                  const org = orgRes.data;
                  this.selectedSupplierContacts.set(org.contacts || []);
                  this.selectedSupplierAddresses.set(org.addresses || []);

                  // Match contactName
                  if (res.contactName) {
                    this.selectedContactName.set(res.contactName);
                  }
                  // Match addressName
                  const addr = (org.addresses || []).find((a: any) => a.address === res.vendorAddress || a.address_name === res.vendorAddress);
                  if (addr) {
                    this.selectedAddressName.set(addr.address_name);
                  }

                  // If preview mode, disable the entire form
                  if (this.isPreviewMode()) {
                    this.poForm.disable();
                  }
                }
              }
            });
          } else {
            // If preview mode, disable the entire form
            if (this.isPreviewMode()) {
              this.poForm.disable();
            }
          }
        }
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Failed to load purchase order details:', err);
        this.error.set('Failed to load purchase order details: ' + (err.message || ''));
      }
    });
  }


  onSupplierChange(event: Event): void {
    const supplierIdStr = (event.target as HTMLSelectElement).value;
    this.selectedSupplierId.set(supplierIdStr);
    if (!supplierIdStr) {
      this.poForm.patchValue({
        vendorName: '',
        vendorGSTIN: '',
        contactName: '',
        contactPhone: '',
        vendorAddress: '',
        vendorPhone: ''
      });
      this.selectedSupplierContacts.set([]);
      this.selectedSupplierAddresses.set([]);
      this.selectedContactName.set('');
      this.selectedAddressName.set('');
      return;
    }

    const supplierId = Number(supplierIdStr);
    const selectedSupplier = this.suppliers().find(s => s.id === supplierId);
    if (selectedSupplier) {
      const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
      const validGSTIN = selectedSupplier.taxNo && GSTIN_REGEX.test(selectedSupplier.taxNo.trim()) ? selectedSupplier.taxNo.trim() : '';

      this.poForm.patchValue({
        vendorName: selectedSupplier.name,
        vendorGSTIN: validGSTIN,
        vendorPhone: selectedSupplier.phone
      });
    }

    this.apiService.getOrganisationById(supplierId).subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const org = res.data;
          this.selectedSupplierContacts.set(org.contacts || []);
          this.selectedSupplierAddresses.set(org.addresses || []);

          if (org.contacts && org.contacts.length > 0) {
            const defaultContact = org.contacts[0];
            this.selectedContactName.set(defaultContact.contact_name);
            this.poForm.patchValue({
              contactName: defaultContact.contact_name,
              contactPhone: defaultContact.mobile_no || defaultContact.telephone_no || ''
            });
          } else {
            this.selectedContactName.set('');
            this.poForm.patchValue({
              contactName: '',
              contactPhone: ''
            });
          }

          if (org.addresses && org.addresses.length > 0) {
            const defaultAddress = org.addresses.find((a: any) => a.is_default) || org.addresses[0];
            this.selectedAddressName.set(defaultAddress.address_name);
            this.poForm.patchValue({
              vendorAddress: defaultAddress.address || `${defaultAddress.address_name}\n${defaultAddress.city_id || ''}`,
              vendorPhone: defaultAddress.address_phone || defaultAddress.address_mobile || selectedSupplier?.phone || ''
            });
          } else {
            this.selectedAddressName.set('');
            this.poForm.patchValue({
              vendorAddress: '',
              vendorPhone: selectedSupplier?.phone || ''
            });
          }
        }
      },
      error: (err) => {
        console.error('Failed to load supplier contacts and addresses:', err);
      }
    });
  }

  onContactChange(event: Event): void {
    const contactName = (event.target as HTMLSelectElement).value;
    this.selectedContactName.set(contactName);
    const contact = this.selectedSupplierContacts().find(c => c.contact_name === contactName);
    if (contact) {
      this.poForm.patchValue({
        contactName: contact.contact_name,
        contactPhone: contact.mobile_no || contact.telephone_no || ''
      });
    } else {
      this.poForm.patchValue({
        contactName: '',
        contactPhone: ''
      });
    }
  }

  onAddressChange(event: Event): void {
    const addressName = (event.target as HTMLSelectElement).value;
    this.selectedAddressName.set(addressName);
    const address = this.selectedSupplierAddresses().find(a => a.address_name === addressName);
    if (address) {
      this.poForm.patchValue({
        vendorAddress: address.address || `${address.address_name}\n${address.city_id || ''}`,
        vendorPhone: address.address_phone || address.address_mobile || ''
      });
    } else {
      this.poForm.patchValue({
        vendorAddress: '',
        vendorPhone: ''
      });
    }
  }

  // ─── Product picker ───────────────────────────────────────────────────────
  openProductPicker(rowIndex: number): void {
    if (this.isPreviewMode()) return;
    if (this.productPickerOpen() && this.productPickerRowIndex() === rowIndex) {
      // toggle off if already open for same row
      this.productPickerOpen.set(false);
      this.productPickerRowIndex.set(null);
      return;
    }
    this.productSearch.set('');
    this.productPickerRowIndex.set(rowIndex);
    this.productPickerOpen.set(true);
  }

  closeProductPicker(): void {
    this.productPickerOpen.set(false);
    this.productPickerRowIndex.set(null);
  }

  selectProduct(product: Product): void {
    const idx = this.productPickerRowIndex();
    if (idx === null) return;
    const ctrl = this.lineItems.at(idx);
    if (!ctrl) return;
    ctrl.patchValue({
      productCode: product.sku || '',
      description: product.name || '',
      hsnCode: product.hsnCode || '',
      partNumber: product.partNumber || '',
      size: product.size || '',
      finish: product.finish || '',
      packaging: product.packaging || '',
      boxQty: product.boxQty || 0,
      unitPrice: product.purchasePrice || 0
    });
    this.lineItemsValue.set(this.lineItems.value);
    this.closeProductPicker();
  }

  addLine(item?: any): void {
    this.lineItems.push(
      this.fb.group({
        productCode: [item ? item.productCode || '' : ''],
        description: [item ? item.description || '' : '', Validators.required],
        partNumber: [item ? item.partNumber || '' : ''],
        size: [item ? item.size || '' : ''],
        finish: [item ? item.finish || '' : ''],
        packaging: [item ? item.packaging || '' : ''],
        boxQty: [item ? item.boxQty || 0 : 0, [Validators.min(0)]],
        hsnCode: [item ? item.hsnCode || '' : '', Validators.required],
        quantity: [item ? item.qty || item.quantity || 0 : 0, [Validators.required, Validators.min(0.001)]],
        unitPrice: [item ? item.rate || item.unitPrice || 0 : 0, [Validators.required, Validators.min(0.01)]]
      })
    );
    this.lineItemsValue.set(this.lineItems.value);
  }

  removeLine(index: number): void {
    if (this.lineItems.length > 1) {
      this.lineItems.removeAt(index);
      this.lineItemsValue.set(this.lineItems.value);
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

    if (this.isEditMode()) {
      const id = this.poId();
      if (!id) return;
      this.purchaseOrderService.update(id, payload).subscribe({
        next: () => {
          this.actionInProgress.set(false);
          this.router.navigate(['/po/list']);
        },
        error: (err) => {
          this.actionInProgress.set(false);
          this.error.set(err?.message ?? 'Failed to update purchase order.');
        }
      });
    } else {
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

