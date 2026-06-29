import { Component, OnInit, computed, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { PurchaseReturnService, PurchaseReturn } from '../../services/purchase-return.service';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { ApiService, Product } from '../../../../services/api.service';
import { ToastService } from '../../../../services/toast.service';

@Component({
  selector: 'app-purchase-return-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './purchase-return-form.component.html',
  styleUrl: './purchase-return-form.component.scss'
})
export class PurchaseReturnFormComponent implements OnInit {
  loading = signal(false);
  error = signal<string | null>(null);
  actionInProgress = signal(false);

  isEditMode = signal(false);
  isPreviewMode = signal(false);
  returnId = signal<string | number | null>(null);

  selectedSupplierId = signal<number | string>('');
  selectedContactName = signal<string>('');
  selectedAddressName = signal<string>('');

  prForm: FormGroup;
  suppliers = signal<any[]>([]);
  purchaseInvoices = signal<any[]>([]);
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
    return this.prForm.get('lineItems') as FormArray;
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
      const q = Number(item.qty) || 0;
      const net = Number(item.netPrice) || 0;
      return sum + q * net;
    }, 0);
  });

  total = computed(() => {
    return this.subtotal() + this.taxValue();
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly purchaseReturnService: PurchaseReturnService,
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly apiService: ApiService,
    private readonly toastService: ToastService
  ) {
    this.prForm = this.fb.group({
      vendorName: ['', [Validators.required]],
      contactName: [''],
      contactPhone: [''],
      vendorAddress: [''],
      vendorPhone: [''],
      returnNo: ['', Validators.required],
      returnDate: [this.todayDateString(), Validators.required],
      supplierReference: [''],
      purchaseInvoice: ['', Validators.required],
      comments: [''],
      lineItems: this.fb.array([]),
      tax: [0, [Validators.required, Validators.min(0)]]
    });

    // Track changes for totals calculations
    this.prForm.get('lineItems')?.valueChanges.subscribe((val) => {
      this.lineItemsValue.set(val || []);
    });
    this.prForm.get('tax')?.valueChanges.subscribe((val) => {
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
      this.returnId.set(idParam);
      if (url.includes('/preview/')) {
        this.isPreviewMode.set(true);
      } else {
        this.isEditMode.set(true);
      }
    }

    // Load Suppliers
    this.apiService.getOrganisations().subscribe({
      next: (res: any) => {
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

          const rId = this.returnId();
          if (rId) {
            this.loadPurchaseReturn(rId);
          }
        }
      },
      error: (err: any) => console.error('Failed to load suppliers:', err)
    });

    // Load Purchase Invoices (Purchase Orders) for dropdown
    this.purchaseOrderService.getList().subscribe({
      next: (res: any) => {
        if (res && res.data) {
          const mapped = res.data.map((po: any) => ({
            id: po.id,
            invoiceNo: po.poNumber || po.orderNumber || ''
          }));
          this.purchaseInvoices.set(mapped);
        }
      },
      error: (err: any) => console.error('Failed to load purchase invoices:', err)
    });

    // Load products for picker
    this.apiService.getProducts().subscribe({
      next: (products: any) => this.products.set(products),
      error: (err: any) => console.error('Failed to load products:', err)
    });

    // Generate Return No if new
    if (!idParam) {
      this.purchaseReturnService.generateReturnNo().subscribe({
        next: (res: any) => {
          if (res && res.returnNo) {
            this.prForm.patchValue({ returnNo: res.returnNo });
          }
        },
        error: () => {
          this.prForm.patchValue({ returnNo: `RTN-${this.buildFallbackNumber()}` });
        }
      });
    }
  }

  loadPurchaseReturn(id: string | number): void {
    this.loading.set(true);
    this.purchaseReturnService.getOne(id).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        if (res) {
          // Clear items
          while (this.lineItems.length > 0) {
            this.lineItems.removeAt(0);
          }

          // Patch fields
          this.prForm.patchValue({
            vendorName: res.vendorName || '',
            contactName: res.contactName || '',
            contactPhone: res.contactPhone || '',
            vendorAddress: res.vendorAddress || '',
            vendorPhone: res.vendorPhone || '',
            returnNo: res.returnNo || '',
            returnDate: res.returnDate ? res.returnDate.split('T')[0] : this.todayDateString(),
            supplierReference: res.supplierReference || '',
            purchaseInvoice: res.purchaseInvoice || '',
            comments: res.comments || '',
            tax: res.taxAmount || 0
          });

          // Add line items
          const items = res.items || [];
          if (items.length > 0) {
            items.forEach((item: any) => this.addLine(item));
          } else {
            this.addLine();
          }

          // Populate supplier contacts & addresses
          const supplier = this.suppliers().find(s => s.name === res.vendorName);
          if (supplier) {
            this.selectedSupplierId.set(supplier.id);
            this.apiService.getOrganisationById(supplier.id).subscribe({
              next: (orgRes: any) => {
                if (orgRes && orgRes.success && orgRes.data) {
                  const org = orgRes.data;
                  this.selectedSupplierContacts.set(org.contacts || []);
                  this.selectedSupplierAddresses.set(org.addresses || []);

                  if (res.contactName) {
                    this.selectedContactName.set(res.contactName);
                  }
                  const addr = (org.addresses || []).find((a: any) => a.address === res.vendorAddress || a.address_name === res.vendorAddress);
                  if (addr) {
                    this.selectedAddressName.set(addr.address_name);
                  }

                  if (this.isPreviewMode()) {
                    this.prForm.disable();
                  }
                }
              }
            });
          } else {
            if (this.isPreviewMode()) {
              this.prForm.disable();
            }
          }
        }
      },
      error: (err: any) => {
        this.loading.set(false);
        this.error.set('Failed to load details: ' + (err.message || ''));
      }
    });
  }

  onSupplierChange(event: Event): void {
    const supplierIdStr = (event.target as HTMLSelectElement).value;
    this.selectedSupplierId.set(supplierIdStr);
    if (!supplierIdStr) {
      this.prForm.patchValue({
        vendorName: '',
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
      this.prForm.patchValue({
        vendorName: selectedSupplier.name,
        vendorPhone: selectedSupplier.phone
      });

      this.apiService.getOrganisationById(supplierId).subscribe({
        next: (res: any) => {
          if (res && res.success && res.data) {
            const org = res.data;
            this.selectedSupplierContacts.set(org.contacts || []);
            this.selectedSupplierAddresses.set(org.addresses || []);

            // Auto-select primary contact and address if available
            if (org.contacts && org.contacts.length > 0) {
              const primaryContact = org.contacts[0];
              this.selectedContactName.set(primaryContact.first_name + ' ' + (primaryContact.last_name || ''));
              this.prForm.patchValue({
                contactName: this.selectedContactName(),
                contactPhone: primaryContact.mobile_number || primaryContact.phone_number || ''
              });
            } else {
              this.selectedContactName.set('');
              this.prForm.patchValue({ contactName: '', contactPhone: '' });
            }

            if (org.addresses && org.addresses.length > 0) {
              const primaryAddr = org.addresses[0];
              this.selectedAddressName.set(primaryAddr.address_name);
              this.prForm.patchValue({ vendorAddress: primaryAddr.address });
            } else {
              this.selectedAddressName.set('');
              this.prForm.patchValue({ vendorAddress: '' });
            }
          }
        },
        error: (err: any) => console.error('Failed to load organisation contacts/addresses:', err)
      });
    }
  }

  onContactChange(event: Event): void {
    const contactName = (event.target as HTMLSelectElement).value;
    this.selectedContactName.set(contactName);
    const contact = this.selectedSupplierContacts().find(c => (c.first_name + ' ' + (c.last_name || '')).trim() === contactName.trim());
    if (contact) {
      this.prForm.patchValue({
        contactPhone: contact.mobile_number || contact.phone_number || ''
      });
    } else {
      this.prForm.patchValue({ contactPhone: '' });
    }
  }

  onAddressChange(event: Event): void {
    const addressName = (event.target as HTMLSelectElement).value;
    this.selectedAddressName.set(addressName);
    const addr = this.selectedSupplierAddresses().find(a => a.address_name === addressName);
    if (addr) {
      this.prForm.patchValue({ vendorAddress: addr.address });
    } else {
      this.prForm.patchValue({ vendorAddress: '' });
    }
  }

  openProductPicker(index: number): void {
    if (this.isPreviewMode()) return;
    this.productPickerRowIndex.set(index);
    this.productSearch.set('');
    this.productPickerOpen.set(true);
  }

  closeProductPicker(): void {
    this.productPickerOpen.set(false);
    this.productPickerRowIndex.set(null);
  }

  selectProduct(p: Product): void {
    const idx = this.productPickerRowIndex();
    if (idx !== null && idx >= 0 && idx < this.lineItems.length) {
      const row = this.lineItems.at(idx) as FormGroup;
      row.patchValue({
        productCode: p.sku || '',
        description: p.name || '',
        size: p.size || '',
        finish: p.finish || '',
        packaging: p.packaging || '',
        invoiceQty: 0,
        qty: 1,
        rate: p.purchasePrice || p.unitPrice || 0,
        discount: 0,
        netPrice: p.purchasePrice || p.unitPrice || 0,
        totalPrice: p.purchasePrice || p.unitPrice || 0
      });
      this.recalculateRow(idx);
    }
    this.closeProductPicker();
  }

  recalculateRow(index: number): void {
    const row = this.lineItems.at(index) as FormGroup;
    const qty = Number(row.get('qty')?.value) || 0;
    const rate = Number(row.get('rate')?.value) || 0;
    const discount = Number(row.get('discount')?.value) || 0;

    const netPrice = Math.max(0, rate - discount);
    const totalPrice = qty * netPrice;

    row.patchValue({
      netPrice,
      totalPrice
    }, { emitEvent: false });

    // Trigger valueChanges manually for parent group calculations
    this.prForm.get('lineItems')?.updateValueAndValidity({ emitEvent: true });
  }

  addLine(item?: any): void {
    const row = this.fb.group({
      productCode: [item?.productCode || ''],
      description: [item?.description || '', Validators.required],
      size: [item?.size || ''],
      finish: [item?.finish || ''],
      packaging: [item?.packaging || ''],
      invoiceQty: [item?.invoiceQty || 0],
      qty: [item?.qty || 1, [Validators.required, Validators.min(0.001)]],
      rate: [item?.rate || 0, [Validators.required, Validators.min(0)]],
      discount: [item?.discount || 0, [Validators.min(0)]],
      netPrice: [item?.netPrice || 0],
      totalPrice: [item?.totalPrice || 0],
      comment: [item?.comment || '']
    });

    // Listen to changes to compute row totals in real-time
    row.valueChanges.subscribe(() => {
      const idx = this.lineItems.controls.indexOf(row);
      if (idx !== -1) {
        this.recalculateRow(idx);
      }
    });

    this.lineItems.push(row);
  }

  removeLine(index: number): void {
    if (this.lineItems.length > 1) {
      this.lineItems.removeAt(index);
    } else {
      this.toastService.warning('A purchase return must contain at least one row.');
    }
  }

  onSubmit(): void {
    if (this.prForm.invalid) {
      this.prForm.markAllAsTouched();
      this.toastService.error('Please fill in all required fields.');
      return;
    }

    const payload = {
      ...this.prForm.value,
      subtotal: this.subtotal(),
      taxAmount: this.taxValue(),
      totalAmount: this.total(),
      items: this.prForm.value.lineItems
    };

    delete payload.lineItems;
    delete payload.tax;

    this.actionInProgress.set(true);
    const rId = this.returnId();

    if (this.isEditMode() && rId) {
      this.purchaseReturnService.update(rId, payload).subscribe({
        next: () => {
          this.toastService.success('Purchase Return updated successfully.');
          this.router.navigate(['/po/return']);
        },
        error: (err: any) => {
          this.actionInProgress.set(false);
          this.toastService.error(err.message || 'Failed to update Purchase Return.');
        }
      });
    } else {
      this.purchaseReturnService.create(payload).subscribe({
        next: () => {
          this.toastService.success('Purchase Return created successfully.');
          this.router.navigate(['/po/return']);
        },
        error: (err: any) => {
          this.actionInProgress.set(false);
          this.toastService.error(err.message || 'Failed to create Purchase Return.');
        }
      });
    }
  }

  private todayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private buildFallbackNumber(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return `${yy}${mm}-${Math.floor(10 + Math.random() * 90)}`;
  }
}
