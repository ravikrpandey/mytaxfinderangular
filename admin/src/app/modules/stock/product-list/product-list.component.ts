import { Component, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, SelectionChangedEvent, ValueFormatterParams, GridApi } from 'ag-grid-community';
import { ApiService, Product } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { GridLayoutService } from '../../../services/grid-layout.service';

interface ProductGridRow extends Product {
  srNo: number;
  categoryText: string;
  subCategoryText: string;
  unitText: string;
  sizeText: string;
  finishText: string;
  packagingText: string;
  salePriceValue: number;
  stockValue: number;
  balanceValue: number;
  shelf?: string;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AgGridAngular],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {
  filterForm: FormGroup;
  rows: Product[] = [];
  gridRows: ProductGridRow[] = [];
  loading = signal(true);
  error = signal<string | null>(null);
  selectedProduct: ProductGridRow | null = null;
  private gridApi!: GridApi<ProductGridRow>;
  readonly LAYOUT_KEY = 'product_list';

  readonly rowSelection: 'single' = 'single';
  readonly overlayNoRowsTemplate = '<span class="pl-grid-empty">No Rows To Show</span>';
  readonly defaultColDef: ColDef<ProductGridRow> = {
    sortable: false,
    resizable: true
  };
  readonly columnDefs: ColDef<ProductGridRow>[] = [
    { headerName: 'SR NO', field: 'srNo', width: 80, minWidth: 70, maxWidth: 90, pinned: 'left' },
    { headerName: 'CODE', field: 'sku', width: 120, minWidth: 110 },
    { headerName: 'NAME', field: 'name', width: 220, minWidth: 180 },
    { headerName: 'SUPPLIER', field: 'supplier', width: 140, minWidth: 120 },
    { headerName: 'PART NUMBER', field: 'partNumber', width: 130, minWidth: 110 },
    { headerName: 'CATEGORY', field: 'categoryText', width: 140, minWidth: 120 },
    { headerName: 'SUB CATEGORY', field: 'subCategoryText', width: 140, minWidth: 120 },
    { headerName: 'UNIT', field: 'unitText', width: 90, minWidth: 80 },
    { headerName: 'SIZE', field: 'sizeText', width: 100, minWidth: 90 },
    { headerName: 'FINISH', field: 'finishText', width: 130, minWidth: 110 },
    { headerName: 'PACKAGING', field: 'packagingText', width: 130, minWidth: 110 },
    { headerName: 'BARCODE', field: 'barcode', width: 130, minWidth: 110 },
    { headerName: 'OUTER BARCODE', field: 'outerBarcode', width: 140, minWidth: 120 },
    { headerName: 'OUTER QTY', field: 'outerQty', width: 100, minWidth: 90,
      cellClass: 'pl-cell-right', headerClass: 'pl-header-right',
      valueFormatter: (p: ValueFormatterParams) => String(Number(p.value) || 0)
    },
    { headerName: 'PALLET BARCODE', field: 'palletBarcode', width: 140, minWidth: 120 },
    { headerName: 'PALLET QTY', field: 'palletQty', width: 100, minWidth: 90,
      cellClass: 'pl-cell-right', headerClass: 'pl-header-right',
      valueFormatter: (p: ValueFormatterParams) => String(Number(p.value) || 0)
    },
    { headerName: 'CURRENCY', field: 'currency', width: 100, minWidth: 80 },
    { headerName: 'EX-RATE', field: 'exRate', width: 100, minWidth: 90,
      cellClass: 'pl-cell-right', headerClass: 'pl-header-right',
      valueFormatter: (p: ValueFormatterParams) => (Number(p.value) || 0).toFixed(4)
    },
    { headerName: 'PURCHASE PRICE', field: 'purchasePrice', width: 130, minWidth: 110,
      cellClass: 'pl-cell-right', headerClass: 'pl-header-right',
      valueFormatter: (p: ValueFormatterParams) => (Number(p.value) || 0).toFixed(2)
    },
    { headerName: 'ADDITIONAL %', field: 'additionalPer', width: 120, minWidth: 100,
      cellClass: 'pl-cell-right', headerClass: 'pl-header-right',
      valueFormatter: (p: ValueFormatterParams) => (Number(p.value) || 0).toFixed(2)
    },
    { headerName: 'LANDED PRICE', field: 'landedPrice', width: 130, minWidth: 110,
      cellClass: 'pl-cell-right', headerClass: 'pl-header-right',
      valueFormatter: (p: ValueFormatterParams) => (Number(p.value) || 0).toFixed(2)
    },
    {
      headerName: 'SALE PRICE', field: 'salePriceValue', width: 120, minWidth: 110,
      cellClass: 'pl-cell-right', headerClass: 'pl-header-right',
      valueFormatter: (p: ValueFormatterParams<ProductGridRow, number>) =>
        (Number(p.value) || 0).toFixed(2)
    },
    { headerName: 'DISCOUNT %', field: 'discount', width: 110, minWidth: 90,
      cellClass: 'pl-cell-right', headerClass: 'pl-header-right',
      valueFormatter: (p: ValueFormatterParams) => (Number(p.value) || 0).toFixed(2)
    },
    { headerName: 'NET PRICE', field: 'netPrice', width: 120, minWidth: 100,
      cellClass: 'pl-cell-right', headerClass: 'pl-header-right',
      valueFormatter: (p: ValueFormatterParams) => (Number(p.value) || 0).toFixed(2)
    },
    { headerName: 'BOX QTY', field: 'boxQty', width: 100, minWidth: 80,
      cellClass: 'pl-cell-right', headerClass: 'pl-header-right',
      valueFormatter: (p: ValueFormatterParams) => String(Number(p.value) || 0)
    },
    {
      headerName: 'STOCK', field: 'stockValue', width: 100, minWidth: 90,
      cellClass: 'pl-cell-right', headerClass: 'pl-header-right',
      valueFormatter: (p: ValueFormatterParams<ProductGridRow, number>) =>
        String(Number(p.value) || 0)
    },
    {
      headerName: 'BALANCE', field: 'balanceValue', width: 110, minWidth: 90,
      cellClass: 'pl-cell-right', headerClass: 'pl-header-right',
      valueFormatter: (p: ValueFormatterParams<ProductGridRow, number>) =>
        String(Number(p.value) || 0)
    },
    { headerName: 'RE-ORDER LEVEL', field: 'reOrderLevel', width: 130, minWidth: 110,
      cellClass: 'pl-cell-right', headerClass: 'pl-header-right',
      valueFormatter: (p: ValueFormatterParams) => String(Number(p.value) || 0)
    },
    { headerName: 'RE-ORDER QTY', field: 'reOrderQty', width: 120, minWidth: 100,
      cellClass: 'pl-cell-right', headerClass: 'pl-header-right',
      valueFormatter: (p: ValueFormatterParams) => String(Number(p.value) || 0)
    },
    { headerName: 'AISLE', field: 'aisle', width: 90, minWidth: 80 },
    { headerName: 'BAY', field: 'bay', width: 90, minWidth: 80 },
    { headerName: 'SHELF', field: 'shelf', width: 90, minWidth: 80 },
    { headerName: 'WEIGHT', field: 'weight', width: 100, minWidth: 90,
      cellClass: 'pl-cell-right', headerClass: 'pl-header-right',
      valueFormatter: (p: ValueFormatterParams) => String(Number(p.value) || 0)
    },
    { headerName: 'LOCATION', field: 'location', width: 130, minWidth: 110 },
    { headerName: 'LOCATION 2', field: 'location2', width: 130, minWidth: 110 },
    { headerName: 'LOCATION 3', field: 'location3', width: 130, minWidth: 110 },
    { headerName: 'LOCATION 4', field: 'location4', width: 130, minWidth: 110 },
    { headerName: 'REMARKS', field: 'remarks', width: 150, minWidth: 120 }
  ];

  constructor(
    private readonly apiService: ApiService,
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly toastService: ToastService,
    private readonly gridLayoutService: GridLayoutService
  ) {
    this.filterForm = this.fb.group({ search: [''] });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedProduct = null;
    const search = String(this.filterForm.get('search')?.value ?? '').trim();
    this.apiService.getProducts(search || undefined).subscribe({
      next: (products) => {
        this.rows = products;
        this.gridRows = products.map((p, i) => this.mapRow(p, i));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to load products');
        this.rows = [];
        this.gridRows = [];
        this.loading.set(false);
      }
    });
  }

  applyFilter(): void { this.loadProducts(); }
  clearFilters(): void {
    this.filterForm.reset({ search: '' });
    this.loadProducts();
  }

  get selectedRecordText(): string {
    const list = this.gridRows;
    const sel = this.selectedProduct;
    if (!sel) return `Record 0 of ${list.length}`;
    const idx = list.findIndex(r => r.id === sel.id);
    return `Record ${idx + 1} of ${list.length}`;
  }

  goToCreate(): void { this.router.navigate(['/stock/products/create']); }

  goToEditSelected(): void {
    if (this.selectedProduct?.id) {
      this.router.navigate(['/stock/products/edit', this.selectedProduct.id]);
    }
  }

  refreshList(): void {
    this.loadProducts();
    this.toastService.success('Product list refreshed');
  }

  deleteSelected(): void {
    const prod = this.selectedProduct;
    if (!prod?.id) {
      this.toastService.warning('Please select a product to delete');
      return;
    }
    if (confirm(`Delete product "${prod.name}"?`)) {
      this.apiService.deleteProduct(prod.id).subscribe({
        next: () => {
          this.toastService.success('Product deleted successfully');
          this.selectedProduct = null;
          this.loadProducts();
        },
        error: (err) => this.toastService.error('Delete failed: ' + (err.message || ''))
      });
    }
  }

  exportToCSV(): void {
    if (!this.rows.length) { this.toastService.warning('No data to export'); return; }
    const headers = ['SR NO', 'CODE', 'NAME', 'CATEGORY', 'SUB CATEGORY', 'UNIT', 'SIZE', 'FINISH', 'PACKAGING', 'SALE PRICE', 'STOCK', 'BALANCE'];
    const rows = this.gridRows.map(r => [
      r.srNo, `"${r.sku}"`, `"${r.name}"`, `"${r.categoryText}"`, `"${r.subCategoryText}"`,
      `"${r.unitText}"`, `"${r.sizeText}"`, `"${r.finishText}"`, `"${r.packagingText}"`,
      r.salePriceValue, r.stockValue, r.balanceValue
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'products_export.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    this.toastService.success('Products exported');
  }

  onGridReady(event: GridReadyEvent<ProductGridRow>): void {
    this.gridApi = event.api;
    const restored = this.gridLayoutService.restoreLayout(this.LAYOUT_KEY, this.gridApi);
    if (!restored) {
      this.gridApi.sizeColumnsToFit();
    }
  }

  saveLayout(): void {
    this.gridLayoutService.saveLayout(this.LAYOUT_KEY, this.gridApi);
    this.toastService.success('Layout saved successfully');
  }

  resetLayout(): void {
    this.gridLayoutService.resetLayout(this.LAYOUT_KEY, this.gridApi, this.columnDefs);
    this.toastService.success('Layout reset to default');
  }

  onSelectionChanged(event: SelectionChangedEvent<ProductGridRow>): void {
    this.selectedProduct = event.api.getSelectedRows()[0] ?? null;
  }

  onRowDoubleClicked(event: any): void {
    if (event.data?.id) this.router.navigate(['/stock/products/edit', event.data.id]);
  }

  private mapRow(p: Product, index: number): ProductGridRow {
    return {
      ...p,
      srNo: index + 1,
      categoryText: p.category || '',
      subCategoryText: p.subCategory || '',
      unitText: p.unit || '',
      sizeText: p.size || '',
      finishText: p.finish || '',
      packagingText: p.packaging || '',
      salePriceValue: Number(p.salePrice ?? p.unitPrice) || 0,
      stockValue: Number(p.stockLevel) || 0,
      balanceValue: Number(p.balance) || 0,
      shelf: (p as any).shelf || ''
    };
  }

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  triggerImport(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input so same file can be selected again
    event.target.value = '';

    Swal.fire({
      title: 'Importing Products',
      text: 'Processing your file, please wait...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.apiService.importProducts(file).subscribe({
      next: (res) => {
        Swal.close();
        if (res && res.success) {
          const summary = res.summary;
          const total = summary.total;
          const created = summary.created;
          const updated = summary.updated;
          const failed = summary.failed;

          let htmlMessage = `
            <div style="text-align: left; font-size: 14px;">
              <p><strong>Total rows processed:</strong> ${total}</p>
              <p style="color: #10b981;"><strong>Created new:</strong> ${created}</p>
              <p style="color: #3b82f6;"><strong>Updated existing:</strong> ${updated}</p>
              <p style="color: #ef4444;"><strong>Failed rows:</strong> ${failed}</p>
          `;

          if (res.errors && res.errors.length > 0) {
            htmlMessage += `
              <div style="margin-top: 15px; border-top: 1px solid #e5e7eb; padding-top: 10px;">
                <h4 style="margin: 0 0 5px 0; color: #b91c1c; font-size: 13px;">Row Errors:</h4>
                <ul style="max-height: 120px; overflow-y: auto; padding-left: 20px; margin: 0; font-size: 12px; color: #555;">
            `;
            res.errors.forEach((err: any) => {
              htmlMessage += `<li>Row ${err.row}: ${err.error}</li>`;
            });
            htmlMessage += `</ul></div>`;
          }

          htmlMessage += `</div>`;

          Swal.fire({
            title: 'Import Results',
            html: htmlMessage,
            icon: failed === 0 ? 'success' : failed === total ? 'error' : 'warning',
            confirmButtonText: 'OK',
            confirmButtonColor: '#0f5e9c'
          });

          this.loadProducts();
        } else {
          Swal.fire({
            title: 'Import Failed',
            text: res.message || 'Unknown error occurred during import.',
            icon: 'error',
            confirmButtonColor: '#ef4444'
          });
        }
      },
      error: (err) => {
        Swal.close();
        console.error('Import error:', err);
        Swal.fire({
          title: 'Import Failed',
          text: err.error?.message || err.error?.error || err.message || 'Failed to upload and import file.',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    });
  }
}
