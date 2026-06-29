import { Component, OnInit, computed, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { StockTransactionService, StockTransaction, StockTransactionItem } from '../../../services/stock-transaction.service';
import { ApiService, Product } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-stock-transaction-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './stock-transaction-form.component.html',
  styleUrl: './stock-transaction-form.component.scss'
})
export class StockTransactionFormComponent implements OnInit {
  loading = signal(false);
  error = signal<string | null>(null);
  actionInProgress = signal(false);

  isEditMode = signal(false);
  isPreviewMode = signal(false);
  txId = signal<string | number | null>(null);

  stkForm: FormGroup;
  products = signal<Product[]>([]);
  productSearch = signal('');
  productPickerOpen = signal(false);
  productPickerRowIndex = signal<number | null>(null);

  // Scanning mode properties
  isScanningEnabled = signal(false);
  barcodeScanValue = signal('');

  // Line items reactive value (kept in sync with FormArray via valueChanges)
  lineItemsValue = signal<any[]>([]);

  // Set of SKUs already used in other rows (excluding the row currently being edited)
  usedProductSkus = computed(() => {
    const items = this.lineItemsValue();
    const currentRowIdx = this.productPickerRowIndex();
    const used = new Set<string>();
    items.forEach((item, idx) => {
      if (item.productCode && idx !== currentRowIdx) {
        used.add(String(item.productCode).toLowerCase());
      }
    });
    return used;
  });

  filteredProducts = computed(() => {
    const q = this.productSearch().toLowerCase().trim();
    const used = this.usedProductSkus();
    return this.products().filter(p => {
      const sku = (p.sku || '').toLowerCase();
      if (used.has(sku)) return false; // hide already-selected products
      if (!q) return true;
      return (
        sku.includes(q) ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q)
      );
    });
  });

  get lineItems(): FormArray {
    return this.stkForm.get('lineItems') as FormArray;
  }

  get lineItemIndices(): number[] {
    const len = this.lineItems?.length ?? 0;
    return Array.from({ length: len }, (_, i) => i);
  }

  totalQty = computed(() => {
    const items = this.lineItemsValue();
    return items.reduce((sum, item) => sum + (Number(item.stockQty) || 0), 0);
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly stockTxService: StockTransactionService,
    private readonly apiService: ApiService,
    private readonly toastService: ToastService,
    private readonly authService: AuthService
  ) {
    this.stkForm = this.fb.group({
      stockType: ['STOCK OUT', [Validators.required]],
      transactionBy: [this.authService.currentUser()?.name || 'Shakul Karnwal', [Validators.required]],
      date: [this.todayDateString(), [Validators.required]],
      reference: ['', [Validators.required]],
      referenceType: [''],
      stockNo: ['', [Validators.required]],
      status: ['DRAFT', [Validators.required]],
      comments: [''],
      lineItems: this.fb.array([])
    });

    this.stkForm.get('lineItems')?.valueChanges.subscribe((val) => {
      this.lineItemsValue.set(val || []);
    });
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
      this.txId.set(idParam);
      if (url.includes('/preview/')) {
        this.isPreviewMode.set(true);
      } else {
        this.isEditMode.set(true);
      }
    }

    // For new transactions: auto-fill transactionBy from logged-in user and lock status to DRAFT
    if (!idParam) {
      const userName = this.authService.currentUser()?.name || 
                       this.authService.currentEntity()?.fullName || 
                       '';
      if (userName) {
        this.stkForm.patchValue({ transactionBy: userName });
      }
      // Status locked to DRAFT on create (not user-editable)
      this.stkForm.get('status')?.disable();
      this.stkForm.patchValue({ status: 'DRAFT' });
    }

    // Load Products
    this.apiService.getProducts().subscribe({
      next: (prods: any) => {
        this.products.set(prods || []);
        
        const id = this.txId();
        if (id) {
          this.loadStockTransaction(id);
        } else {
          this.addLine();
        }
      },
      error: (err: any) => console.error('Failed to load products:', err)
    });

    // Auto-generate stock number if new
    if (!idParam) {
      this.stockTxService.generateStockNo().subscribe({
        next: (res) => {
          if (res && res.stockNo) {
            this.stkForm.patchValue({ stockNo: res.stockNo });
          }
        },
        error: () => {
          this.stkForm.patchValue({ stockNo: `STK-${this.buildFallbackNumber()}` });
        }
      });
    }
  }

  loadStockTransaction(id: string | number): void {
    this.loading.set(true);
    this.stockTxService.getOne(id).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res) {
          // Clear items
          while (this.lineItems.length > 0) {
            this.lineItems.removeAt(0);
          }

          // Patch Form Fields
          this.stkForm.patchValue({
            stockType: res.stockType || 'STOCK OUT',
            transactionBy: res.transactionBy || '',
            date: res.date ? res.date.split('T')[0] : this.todayDateString(),
            reference: res.reference || '',
            referenceType: res.referenceType || '',
            stockNo: res.stockNo || '',
            status: res.status || 'DRAFT',
            comments: res.comments || ''
          });

          // Add line items
          const items = res.items || [];
          if (items.length > 0) {
            items.forEach((item: any) => this.addLine(item));
          } else {
            this.addLine();
          }

          if (this.isPreviewMode() || res.status === 'CONFIRM' || res.status === 'CANCELLED') {
            this.stkForm.disable();
          }
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Failed to load stock transaction: ' + (err.message || ''));
      }
    });
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
      const currentBalance = Number(p.balance ?? p.stockLevel ?? 0);
      row.patchValue({
        productCode: p.sku || '',
        description: p.name || '',
        size: p.size || '',
        finish: p.finish || '',
        packaging: p.packaging || '',
        balance: currentBalance,
        stockQty: 1,
        costPrice: p.purchasePrice || p.unitPrice || 0,
        salePrice: p.salePrice || 0
      });
    }
    this.closeProductPicker();
  }

  addLine(item?: any): void {
    const row = this.fb.group({
      productCode: [item?.productCode || '', Validators.required],
      description: [item?.description || '', Validators.required],
      size: [item?.size || ''],
      finish: [item?.finish || ''],
      packaging: [item?.packaging || ''],
      balance: [item?.balance || 0],
      stockQty: [item?.stockQty || 0, [Validators.required, Validators.min(0)]],
      costPrice: [item?.costPrice || 0],
      salePrice: [item?.salePrice || 0],
      comments: [item?.comments || '']
    });

    this.lineItems.push(row);
  }

  removeLine(index: number): void {
    if (this.lineItems.length > 1) {
      this.lineItems.removeAt(index);
    } else {
      this.toastService.warning('Stock transaction must contain at least one row.');
    }
  }

  toggleScanning(): void {
    this.isScanningEnabled.set(!this.isScanningEnabled());
    this.barcodeScanValue.set('');
  }

  onBarcodeScan(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const code = this.barcodeScanValue().trim();
      if (!code) return;

      const p = this.products().find(prod => 
        String(prod.barcode || '').toLowerCase() === code.toLowerCase() || 
        String(prod.sku || '').toLowerCase() === code.toLowerCase()
      );

      if (p) {
        // Check if this product is already added in another row
        const alreadyAdded = this.lineItemsValue().some(
          item => item.productCode && String(item.productCode).toLowerCase() === String(p.sku || '').toLowerCase()
        );
        if (alreadyAdded) {
          this.toastService.warning(`"${p.name}" is already added. Each product can only appear once.`);
          this.barcodeScanValue.set('');
          return;
        }

        // Add to items
        const currentBalance = Number(p.balance ?? p.stockLevel ?? 0);
        const emptyIndex = this.findEmptyRowIndex();
        if (emptyIndex !== -1) {
          const row = this.lineItems.at(emptyIndex) as FormGroup;
          row.patchValue({
            productCode: p.sku || '',
            description: p.name || '',
            size: p.size || '',
            finish: p.finish || '',
            packaging: p.packaging || '',
            balance: currentBalance,
            stockQty: 1,
            costPrice: p.purchasePrice || p.unitPrice || 0,
            salePrice: p.salePrice || 0
          });
        } else {
          this.addLine({
            productCode: p.sku || '',
            description: p.name || '',
            size: p.size || '',
            finish: p.finish || '',
            packaging: p.packaging || '',
            balance: currentBalance,
            stockQty: 1,
            costPrice: p.purchasePrice || p.unitPrice || 0,
            salePrice: p.salePrice || 0
          });
        }

        this.toastService.success(`Added product: ${p.name}`);
        this.barcodeScanValue.set('');
      } else {
        this.toastService.error(`Product with Barcode/SKU "${code}" not found.`);
      }
    }
  }

  private findEmptyRowIndex(): number {
    for (let i = 0; i < this.lineItems.length; i++) {
      const row = this.lineItems.at(i);
      if (!row.value.productCode && !row.value.description) {
        return i;
      }
    }
    return -1;
  }

  exportCSV(): void {
    const items = this.lineItems.value;
    if (items.length === 0) {
      this.toastService.warning('No items to export');
      return;
    }

    const headers = ['PRODUCT CODE', 'PRODUCT DESCRIPTION', 'SIZE', 'FINISH', 'PACKAGING', 'BALANCE', 'STOCK QTY', 'COST PRICE', 'SALE PRICE', 'COMMENTS'];
    const csvRows = items.map((row: any) => [
      `"${row.productCode || ''}"`,
      `"${row.description || ''}"`,
      `"${row.size || ''}"`,
      `"${row.finish || ''}"`,
      `"${row.packaging || ''}"`,
      row.balance || 0,
      row.stockQty || 0,
      row.costPrice || 0,
      row.salePrice || 0,
      `"${row.comments || ''}"`
    ]);

    const csvContent = [headers.join(','), ...csvRows.map((e: any) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Stock_Transaction_${this.stkForm.get('stockNo')?.value || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toastService.success('Exported to CSV successfully');
  }

  onSubmit(): void {
    if (this.stkForm.invalid) {
      this.stkForm.markAllAsTouched();
      this.toastService.error('Please fill in all required fields.');
      return;
    }

    const rawVal = this.stkForm.getRawValue();
    const payload = {
      ...rawVal,
      items: rawVal.lineItems
    };

    delete payload.lineItems;

    this.actionInProgress.set(true);
    const id = this.txId();

    if (this.isEditMode() && id) {
      this.stockTxService.update(id, payload).subscribe({
        next: () => {
          this.toastService.success('Stock Transaction updated successfully.');
          this.router.navigate(['/stock/transactions']);
        },
        error: (err) => {
          this.actionInProgress.set(false);
          this.toastService.error(err.message || 'Failed to update Stock Transaction.');
        }
      });
    } else {
      this.stockTxService.create(payload).subscribe({
        next: () => {
          this.toastService.success('Stock Transaction created successfully.');
          this.router.navigate(['/stock/transactions']);
        },
        error: (err) => {
          this.actionInProgress.set(false);
          this.toastService.error(err.message || 'Failed to create Stock Transaction.');
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
    return `${yy}${mm}${Math.floor(100 + Math.random() * 900)}`;
  }
}
