import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService, Product } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

interface MasterItem { id: number; name: string; code?: string; }

@Component({
  selector: 'app-product-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './product-create.component.html',
  styleUrl: './product-create.component.scss'
})
export class ProductCreateComponent implements OnInit {
  form: FormGroup;
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  activeTab = 'details';

  isEditMode = signal(false);
  productId = signal<string | null>(null);

  // Master data options
  unitOptions = signal<MasterItem[]>([]);
  sizeOptions = signal<MasterItem[]>([]);
  finishOptions = signal<MasterItem[]>([]);
  packagingOptions = signal<MasterItem[]>([]);
  categoryOptions = signal<MasterItem[]>([]);
  subCategoryOptions = signal<MasterItem[]>([]);
  currencyOptions = signal<MasterItem[]>([]);
  supplierOptions = signal<{ id: number; name: string }[]>([]);

  readonly tabs = ['DETAILS', 'FULL DESCRIPTION', 'PICTURES', 'ACTIVITY'];

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly apiService: ApiService,
    private readonly toastService: ToastService
  ) {
    this.form = this.fb.group({
      // Header
      name: ['', Validators.required],
      sku: ['', Validators.required],
      // Details
      supplier: [''],
      partNumber: [''],
      currency: ['GBP'],
      exRate: [1],
      purchasePrice: [null],
      additionalPer: [null],
      landedPrice: [null],
      salePrice: [null],
      discount: [null],
      netPrice: [null],
      unit: ['', Validators.required],
      size: ['', Validators.required],
      finish: ['', Validators.required],
      packaging: ['', Validators.required],
      category: ['', Validators.required],
      subCategory: ['', Validators.required],
      aisle: [''],
      bay: [''],
      weight: [null],
      reOrderLevel: [null],
      reOrderQty: [null],
      isStockItem: [true],
      balance: [null],
      boxQty: [null],
      barcode: [''],
      outerBarcode: [''],
      outerQty: [null],
      palletBarcode: [''],
      palletQty: [null],
      location: [''],
      location2: [''],
      location3: [''],
      location4: [''],
      remarks: [''],
      isActive: [true],
      published: [false],
      // Full description tab
      fullDescription: [''],
      // Pictures
      imagePath: [''],
      images: [[]]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode.set(true);
      this.productId.set(idParam);
    }

    this.loadMasterData();
    this.loadSuppliers();

    if (idParam) {
      this.loadProduct(idParam);
    } else {
      // Auto-generate unique product code (SKU)
      const generatedSku = 'PRD-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      this.form.patchValue({ sku: generatedSku });
    }
  }

  private loadMasterData(): void {
    const keys = 'unit,product_size,product_finish,packaging,product_category,product_subcategory,currency';
    this.apiService.getMasterDataBulkByKeys(keys).subscribe({
      next: (res) => {
        if (res?.data) {
          const dArray = res.data;
          const d: any = {};
          if (Array.isArray(dArray)) {
            dArray.forEach((item: any) => {
              if (item && item.master_type_key) {
                d[item.master_type_key] = item;
              }
            });
          }

          const mapData = (items: any[] | undefined): MasterItem[] => {
            if (!items) return [];
            return items.map(item => ({
              id: item.id,
              name: item.label || item.name || '',
              code: item.code || ''
            }));
          };

          this.unitOptions.set(mapData(d['unit']?.data));
          this.sizeOptions.set(mapData(d['product_size']?.data));
          this.finishOptions.set(mapData(d['product_finish']?.data));
          this.packagingOptions.set(mapData(d['packaging']?.data));
          this.categoryOptions.set(mapData(d['product_category']?.data));
          this.subCategoryOptions.set(mapData(d['product_subcategory']?.data));
          this.currencyOptions.set(mapData(d['currency']?.data));

          this.seedMissingMasterData(d);
        }
      },
      error: () => {}
    });
  }

  private seedMissingMasterData(existingBulk: any): void {
    const requiredKeys = [
      { key: 'unit', label: 'Unit', defaultData: [
        { id: 1, name: 'BOX', code: 'BOX' },
        { id: 2, name: 'PIECES', code: 'PCS' },
        { id: 3, name: 'KG', code: 'KG' },
        { id: 4, name: 'METERS', code: 'M' },
        { id: 5, name: 'PACKS', code: 'PK' }
      ]},
      { key: 'product_size', label: 'Product Size', defaultData: [
        { id: 1, name: 'SMALL', code: 'S' },
        { id: 2, name: 'MEDIUM', code: 'M' },
        { id: 3, name: 'LARGE', code: 'L' },
        { id: 4, name: 'EXTRA LARGE', code: 'XL' }
      ]},
      { key: 'product_finish', label: 'Product Finish', defaultData: [
        { id: 1, name: 'MATT', code: 'MATT' },
        { id: 2, name: 'GLOSSY', code: 'GLOSSY' },
        { id: 3, name: 'SATIN', code: 'SATIN' },
        { id: 4, name: 'POLISHED', code: 'POLISHED' }
      ]},
      { key: 'packaging', label: 'Packaging', defaultData: [
        { id: 1, name: 'BOX PACKING', code: 'BOX' },
        { id: 2, name: 'CARTON', code: 'CRT' },
        { id: 3, name: 'PALLET', code: 'PLT' }
      ]},
      { key: 'product_category', label: 'Product Category', defaultData: [
        { id: 1, name: 'RAW MATERIALS', code: 'RAW' },
        { id: 2, name: 'FINISHED GOODS', code: 'FIN' },
        { id: 3, name: 'PACKAGING MATERIALS', code: 'PKG' }
      ]},
      { key: 'product_subcategory', label: 'Product Sub Category', defaultData: [
        { id: 1, name: 'GENERAL', code: 'GEN' },
        { id: 2, name: 'PREMIUM', code: 'PRM' },
        { id: 3, name: 'IMPORTED', code: 'IMP' }
      ]},
      { key: 'currency', label: 'Currency', defaultData: [
        { id: 1, name: 'GBP', code: 'GBP' },
        { id: 2, name: 'INR', code: 'INR' },
        { id: 3, name: 'USD', code: 'USD' },
        { id: 4, name: 'EUR', code: 'EUR' }
      ]}
    ];

    const missing = requiredKeys.filter(req => {
      const existing = existingBulk[req.key];
      return !existing || !existing.data || existing.data.length === 0;
    });

    if (missing.length === 0) {
      return;
    }

    this.apiService.getAllMasterData().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const list = res.data;
          let nextId = Math.max(...list.map((item: any) => item.master_type_id || 0), 10) + 1;

          const createNext = (index: number) => {
            if (index >= missing.length) {
              // Reload once done
              this.loadMasterData();
              return;
            }

            const itemToSeed = missing[index];
            const payload = {
              master_type_id: nextId++,
              master_type_key: itemToSeed.key,
              master_type_label: itemToSeed.label,
              status: 'Active',
              data: itemToSeed.defaultData.map(d => ({
                id: d.id,
                name: d.name,
                code: d.code
              }))
            };

            this.apiService.createMasterData(payload).subscribe({
              next: () => createNext(index + 1),
              error: () => createNext(index + 1)
            });
          };

          createNext(0);
        }
      }
    });
  }

  private loadSuppliers(): void {
    this.apiService.getOrganisations().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          const suppliers = res.data
            .filter((item: any) => {
              const type = item.customer_type_names || (item.customerType ? item.customerType.list_name : '');
              return type?.toUpperCase().includes('SUPPLIER');
            })
            .map((item: any) => ({ id: item.id, name: item.customer_name }));
          this.supplierOptions.set(suppliers);
        }
      },
      error: () => {}
    });
  }

  private loadProduct(id: string): void {
    this.loading.set(true);
    this.apiService.getProductById(id).subscribe({
      next: (product) => {
        this.loading.set(false);
        if (product) {
          this.form.patchValue({
            name: product.name ?? '',
            sku: product.sku ?? '',
            supplier: product.supplier ?? '',
            partNumber: product.partNumber ?? '',
            currency: product.currency ?? 'GBP',
            exRate: product.exRate ?? 1,
            purchasePrice: product.purchasePrice ?? null,
            additionalPer: product.additionalPer ?? null,
            landedPrice: product.landedPrice ?? null,
            salePrice: product.salePrice ?? null,
            discount: product.discount ?? null,
            netPrice: product.netPrice ?? null,
            unit: product.unit ?? '',
            size: product.size ?? '',
            finish: product.finish ?? '',
            packaging: product.packaging ?? '',
            category: product.category ?? '',
            subCategory: product.subCategory ?? '',
            aisle: product.aisle ?? '',
            bay: product.bay ?? '',
            weight: product.weight ?? null,
            reOrderLevel: product.reOrderLevel ?? null,
            reOrderQty: product.reOrderQty ?? null,
            isStockItem: product.isStockItem ?? true,
            balance: product.balance ?? null,
            boxQty: product.boxQty ?? null,
            barcode: product.barcode ?? '',
            outerBarcode: product.outerBarcode ?? '',
            outerQty: product.outerQty ?? null,
            palletBarcode: product.palletBarcode ?? '',
            palletQty: product.palletQty ?? null,
            location: product.location ?? '',
            location2: product.location2 ?? '',
            location3: product.location3 ?? '',
            location4: product.location4 ?? '',
            remarks: product.remarks ?? '',
            isActive: product.isActive ?? true,
            published: product.published ?? false,
            fullDescription: product.fullDescription ?? '',
            imagePath: product.imagePath ?? '',
            images: product.images ?? []
          });
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load product details.');
      }
    });
  }

  setTab(tab: string): void { this.activeTab = tab.toLowerCase().replace(' ', '_'); }

  isTabActive(tab: string): boolean {
    return this.activeTab === tab.toLowerCase().replace(' ', '_');
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please fill in all required fields.');
      return;
    }
    this.error.set(null);
    this.saving.set(true);

    const v = this.form.value;
    const payload: any = { ...v };

    const id = this.productId();
    if (this.isEditMode() && id) {
      this.apiService.updateProduct(id, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.toastService.success('Product updated successfully');
          this.router.navigate(['/stock/products']);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err?.error?.message ?? err?.message ?? 'Failed to update product.');
        }
      });
    } else {
      this.apiService.createProduct(payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.toastService.success('Product created successfully');
          this.router.navigate(['/stock/products']);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err?.error?.message ?? err?.message ?? 'Failed to create product.');
        }
      });
    }
  }

  // Helper to get full absolute URL of uploaded images to display them in UI
  getFullImagePath(relativePath: string): string {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    return `http://localhost:5000${relativePath}`;
  }

  // Handle single image upload for Details tab
  onSingleImageSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (!file) return;

    this.apiService.uploadProductImage(file).subscribe({
      next: (res) => {
        if (res && res.filePath) {
          this.form.patchValue({ imagePath: res.filePath });
          this.toastService.success('Main image uploaded successfully');
        }
      },
      error: (err) => {
        this.toastService.error(err?.error?.message ?? err?.message ?? 'Failed to upload main image');
      }
    });
  }

  removeSingleImage(): void {
    this.form.patchValue({ imagePath: '' });
  }

  // Handle multiple image upload for Pictures tab
  onMultipleImagesSelected(event: any): void {
    const files = event.target?.files;
    if (!files || files.length === 0) return;

    this.apiService.uploadProductImages(files).subscribe({
      next: (res) => {
        if (res && res.filePaths) {
          const currentImages = this.form.get('images')?.value || [];
          const updatedImages = [...currentImages, ...res.filePaths];
          this.form.patchValue({ images: updatedImages });
          this.toastService.success(`${res.filePaths.length} catalog images uploaded successfully`);
        }
      },
      error: (err) => {
        this.toastService.error(err?.error?.message ?? err?.message ?? 'Failed to upload catalog images');
      }
    });
  }

  removeMultipleImage(index: number): void {
    const currentImages = this.form.get('images')?.value || [];
    const updatedImages = currentImages.filter((_: any, idx: number) => idx !== index);
    this.form.patchValue({ images: updatedImages });
  }

  close(): void { this.router.navigate(['/stock/products']); }
}
