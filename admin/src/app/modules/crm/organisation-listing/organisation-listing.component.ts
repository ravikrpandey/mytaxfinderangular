import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, SelectionChangedEvent, GridApi } from 'ag-grid-community';
import { GridLayoutService } from '../../../services/grid-layout.service';

interface Organisation {
  id: number;
  customerType: string;
  code: string;
  name: string;
  taxNo: string;
  phone: string;
  email: string;
  website: string;
  balance: number;
}

@Component({
  selector: 'app-organisation-listing',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './organisation-listing.component.html',
  styleUrl: './organisation-listing.component.scss'
})
export class OrganisationListingComponent implements OnInit {
  searchTerm = signal('');

  mockOrganisations: Organisation[] = [
    {
      id: 1,
      customerType: 'SUPPLIER, CUSTOMER',
      code: 'ZED0001',
      name: 'ZED FOR SHEDS LIMITE',
      taxNo: 'sadfs',
      phone: '01772824870',
      email: 'sales@zedfix.com',
      website: 'asdfs.com',
      balance: 0
    },
    {
      id: 2,
      customerType: 'SUPPLIER',
      code: 'YAN001',
      name: 'YANTAI LOCK SUPPLIES',
      taxNo: 'its taxsdf',
      phone: '01252448700',
      email: 'yantailocku@gmail.com',
      website: 'sadfsd.com',
      balance: 0
    },
    {
      id: 3,
      customerType: 'CUSTOMER',
      code: 'XTR001',
      name: 'XTRA BUILDING SUPPLII',
      taxNo: '',
      phone: '020 8577 5430',
      email: '',
      website: '',
      balance: 0
    },
    {
      id: 4,
      customerType: 'SUPPLIER',
      code: 'XLT001',
      name: 'XL TAPE INTERNATIONA',
      taxNo: 'XL TAX',
      phone: '48413489226',
      email: 'wchewicki@bluedolp',
      website: 'XL.COM',
      balance: 0
    },
    {
      id: 5,
      customerType: 'MANUFACTURER, SUPPLIER',
      code: 'XIN001',
      name: 'XINGSHENGFA HARDWA',
      taxNo: 'asdfsadf',
      phone: '8613826274238',
      email: 'xsf02@gz-xsf.com',
      website: 'www.gz-xsf.com',
      balance: 0
    },
    {
      id: 6,
      customerType: 'SUPPLIER',
      code: 'WUH001',
      name: 'WUHU AIHUA INDUSTRI',
      taxNo: '.',
      phone: '00865532667230',
      email: 'qualpro1006@keybui',
      website: 'www.keytobuilding.com',
      balance: 0
    },
    {
      id: 7,
      customerType: 'CUSTOMER',
      code: 'WTL001',
      name: 'WT LYNN',
      taxNo: 'TAX NO',
      phone: '01782834818',
      email: 'pandeyravikumar181',
      website: 'website.com',
      balance: 0
    },
    {
      id: 8,
      customerType: 'SUPPLIER',
      code: 'WOO001',
      name: 'WOOLBRO DISTRIBUTIC',
      taxNo: '',
      phone: '01274725396',
      email: 'sales@rapideproduct',
      website: 'www.rapideproducts.co.uk',
      balance: 0
    },
    {
      id: 9,
      customerType: 'CUSTOMER',
      code: 'WBM001',
      name: 'WINGATE BUILDERS ME',
      taxNo: '.',
      phone: '02084785075',
      email: 'WINGATE@GMAIL.C',
      website: '.',
      balance: 0
    },
    {
      id: 10,
      customerType: 'CUSTOMER',
      code: 'WIL005',
      name: 'WILLESDEN SUPPLIES L',
      taxNo: '.',
      phone: '02084594440',
      email: 'willesdensupplies@gi',
      website: '.',
      balance: 0
    }
  ];

  organisations = signal<Organisation[]>(this.mockOrganisations);
  selectedOrgId = signal<number | null>(null);
  private gridApi!: GridApi<Organisation>;
  readonly LAYOUT_KEY = 'organisation_list';

  readonly rowSelection: 'single' = 'single';
  readonly overlayNoRowsTemplate = '<span class="org-grid-empty">No Rows To Show</span>';
  readonly defaultColDef: ColDef<Organisation> = {
    sortable: true,
    resizable: true,
    filter: true
  };
  readonly columnDefs: ColDef<Organisation>[] = [
    {
      headerName: 'SR NO.',
      valueGetter: 'node.rowIndex + 1',
      width: 70,
      minWidth: 60,
      maxWidth: 90,
      pinned: 'left'
    },
    {
      headerName: 'CUSTOMER T...',
      field: 'customerType',
      width: 160,
      minWidth: 140
    },
    {
      headerName: 'CODE',
      field: 'code',
      width: 100,
      minWidth: 90
    },
    {
      headerName: 'NAME',
      field: 'name',
      width: 240,
      minWidth: 200
    },
    {
      headerName: 'TAX NO.',
      field: 'taxNo',
      width: 120,
      minWidth: 100,
      valueFormatter: (params) => params.value || '.'
    },
    {
      headerName: 'PHONE',
      field: 'phone',
      width: 130,
      minWidth: 110
    },
    {
      headerName: 'EMAIL',
      field: 'email',
      width: 180,
      minWidth: 150,
      valueFormatter: (params) => params.value || '.'
    },
    {
      headerName: 'WEBSITE',
      field: 'website',
      width: 180,
      minWidth: 150,
      valueFormatter: (params) => params.value || '.'
    },
    {
      headerName: 'BALANCE',
      field: 'balance',
      width: 120,
      minWidth: 100,
      cellClass: 'num',
      headerClass: 'header-right'
    }
  ];

  constructor(
    private router: Router,
    private apiService: ApiService,
    private toastService: ToastService,
    private gridLayoutService: GridLayoutService
  ) { }

  ngOnInit(): void {
    this.loadOrganisations();
  }

  onGridReady(event: GridReadyEvent<Organisation>): void {
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

  onSelectionChanged(event: SelectionChangedEvent<Organisation>): void {
    const selected = event.api.getSelectedRows()[0] ?? null;
    this.selectedOrgId.set(selected ? selected.id : null);
  }

  onRowDoubleClicked(event: any): void {
    if (event.data && event.data.id) {
      this.doubleClickEdit(event.data.id);
    }
  }

  selectOrganisation(id: number): void {
    this.selectedOrgId.set(this.selectedOrgId() === id ? null : id);
  }

  goToEditSelected(): void {
    const id = this.selectedOrgId();
    if (id) {
      this.router.navigate(['/crm/organisation/edit', id]);
    }
  }

  goToPreviewSelected(): void {
    const id = this.selectedOrgId();
    if (id) {
      this.router.navigate(['/crm/organisation/preview', id]);
    }
  }

  refreshList(): void {
    this.loadOrganisations();
    this.toastService.success('Organisation list refreshed successfully');
  }

  deleteSelected(): void {
    const id = this.selectedOrgId();
    if (!id) {
      this.toastService.warning('Please select an organisation to delete');
      return;
    }

    const org = this.organisations().find(o => o.id === id);
    if (!org) return;

    if (confirm(`Are you sure you want to delete organisation ${org.name}?`)) {
      this.apiService.deleteOrganisation(id).subscribe({
        next: (res) => {
          this.toastService.success('Organisation deleted successfully');
          this.selectedOrgId.set(null);
          this.loadOrganisations();
        },
        error: (err) => {
          console.error('Failed to delete organisation:', err);
          this.toastService.error('Failed to delete organisation: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  exportToCSV(): void {
    const data = this.organisations();
    if (data.length === 0) {
      this.toastService.warning('No data available to export');
      return;
    }

    const headers = ['ID', 'Customer Type', 'Code', 'Name', 'Tax No', 'Phone', 'Email', 'Website', 'Balance'];
    const rows = data.map(org => [
      org.id,
      `"${org.customerType.replace(/"/g, '""')}"`,
      `"${org.code.replace(/"/g, '""')}"`,
      `"${org.name.replace(/"/g, '""')}"`,
      `"${(org.taxNo || '').replace(/"/g, '""')}"`,
      `"${(org.phone || '').replace(/"/g, '""')}"`,
      `"${(org.email || '').replace(/"/g, '""')}"`,
      `"${(org.website || '').replace(/"/g, '""')}"`,
      org.balance
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'crm_organisations_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toastService.success('Organisations exported to CSV successfully');
  }

  loadOrganisations(): void {
    this.apiService.getOrganisations().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const mapped: Organisation[] = res.data.map((item: any) => ({
            id: item.id,
            customerType: item.customer_type_names || (item.customerType ? item.customerType.list_name : 'CUSTOMER'),
            code: item.customer_code,
            name: item.customer_name,
            taxNo: item.tax_registeration_number || '',
            phone: item.phone_number || '',
            email: item.details_email || '',
            website: item.website || '',
            balance: Number(item.balance) || 0
          }));
          this.organisations.set(mapped);
        }
      },
      error: (err) => {
        console.error('Failed to load organisations from backend, using mocks', err);
        this.toastService.error('Failed to load organisations from backend. Using mock fallback data.');
        this.organisations.set(this.mockOrganisations);
      }
    });
  }

  get filteredOrganisations(): Organisation[] {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.organisations();
    }

    return this.organisations().filter((org) =>
      [
        org.customerType,
        org.code,
        org.name,
        org.taxNo,
        org.phone,
        org.email,
        org.website
      ]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }

  get selectedRecordText(): string {
    const list = this.filteredOrganisations;
    const id = this.selectedOrgId();
    if (!id) {
      return `Record 0 of ${list.length}`;
    }
    const idx = list.findIndex(org => org.id === id);
    return `Record ${idx + 1} of ${list.length}`;
  }

  goToCreate(): void {
    this.router.navigate(['/crm/organisation/create']);
  }

  doubleClickEdit(id: number): void {
    this.router.navigate(['/crm/organisation/edit', id]);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }
}
