import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, SelectionChangedEvent, GridApi } from 'ag-grid-community';
import { GridLayoutService } from '../../../services/grid-layout.service';

interface MasterDataItem {
  id: number;
  name: string;
  code?: string;
}

interface MasterDataRecord {
  id?: number;
  master_type_id: number;
  master_type_key: string;
  master_type_label: string;
  data: MasterDataItem[];
  status: string;
}

@Component({
  selector: 'app-master-data-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './master-data-admin.component.html',
  styleUrl: './master-data-admin.component.scss'
})
export class MasterDataAdminComponent implements OnInit {
  masterDataList = signal<MasterDataRecord[]>([]);
  selectedRecordId = signal<number | null>(null);
  searchTerm = signal('');

  // Form State
  isFormMode = false;
  isEditMode = false;
  formSubmitted = false;

  model: MasterDataRecord = {
    master_type_id: null as any,
    master_type_key: '',
    master_type_label: '',
    data: [],
    status: 'Active'
  };

  private gridApi!: GridApi;
  readonly LAYOUT_KEY = 'master_data_admin_list';

  // AG-Grid Configurations
  readonly rowSelection: 'single' = 'single';
  readonly overlayNoRowsTemplate = '<span class="org-grid-empty">No Rows To Show</span>';
  readonly defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    filter: true
  };

  readonly columnDefs: ColDef[] = [
    {
      headerName: 'SR NO.',
      valueGetter: 'node.rowIndex + 1',
      width: 70,
      minWidth: 60,
      maxWidth: 90,
      pinned: 'left'
    },
    {
      headerName: 'MASTER TYPE ID',
      field: 'master_type_id',
      width: 150,
      minWidth: 120
    },
    {
      headerName: 'KEY',
      field: 'master_type_key',
      width: 180,
      minWidth: 150
    },
    {
      headerName: 'LABEL',
      field: 'master_type_label',
      width: 200,
      minWidth: 160
    },
    {
      headerName: 'ITEMS COUNT',
      valueGetter: 'data.data ? data.data.length : 0',
      width: 130,
      minWidth: 110
    },
    {
      headerName: 'STATUS',
      field: 'status',
      width: 120,
      minWidth: 100
    }
  ];

  constructor(
    private apiService: ApiService,
    private toastService: ToastService,
    private readonly gridLayoutService: GridLayoutService
  ) {}

  ngOnInit(): void {
    this.loadMasterData();
  }

  onGridReady(event: GridReadyEvent): void {
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

  loadMasterData(): void {
    this.apiService.getAllMasterData().subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          this.masterDataList.set(res.data);
        }
      },
      error: (err) => {
        console.error('Failed to load master data:', err);
        this.toastService.error('Failed to load master data from backend.');
      }
    });
  }

  get filteredMasterDataList(): MasterDataRecord[] {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.masterDataList();
    }
    return this.masterDataList().filter((item) =>
      [
        String(item.master_type_id),
        item.master_type_key,
        item.master_type_label,
        item.status
      ]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }

  get selectedRecordText(): string {
    const list = this.filteredMasterDataList;
    const id = this.selectedRecordId();
    if (!id) {
      return `Record 0 of ${list.length}`;
    }
    const idx = list.findIndex(r => r.id === id);
    return `Record ${idx + 1} of ${list.length}`;
  }

  onSelectionChanged(event: SelectionChangedEvent): void {
    const selectedRows = event.api.getSelectedRows();
    const selected = selectedRows[0] as MasterDataRecord | undefined;
    this.selectedRecordId.set(selected ? selected.id! : null);
  }

  onRowDoubleClicked(event: any): void {
    const data = event.data as MasterDataRecord;
    if (data && data.id) {
      this.doubleClickEdit(data.id);
    }
  }

  doubleClickEdit(id: number): void {
    const record = this.masterDataList().find(r => r.id === id);
    if (record) {
      this.selectedRecordId.set(id);
      this.editSelected();
    }
  }

  addNew(): void {
    this.isFormMode = true;
    this.isEditMode = false;
    this.formSubmitted = false;
    this.model = {
      master_type_id: null as any,
      master_type_key: '',
      master_type_label: '',
      data: [],
      status: 'Active'
    };
  }

  editSelected(): void {
    const id = this.selectedRecordId();
    if (!id) {
      this.toastService.warning('Please select a master data record to edit.');
      return;
    }
    const record = this.masterDataList().find(r => r.id === id);
    if (!record) {
      this.toastService.error('Selected record not found.');
      return;
    }

    this.isFormMode = true;
    this.isEditMode = true;
    this.formSubmitted = false;
    this.model = {
      id: record.id,
      master_type_id: record.master_type_id,
      master_type_key: record.master_type_key,
      master_type_label: record.master_type_label,
      data: record.data ? JSON.parse(JSON.stringify(record.data)) : [],
      status: record.status || 'Active'
    };
  }

  deleteSelected(): void {
    const id = this.selectedRecordId();
    if (!id) {
      this.toastService.warning('Please select a master data record to delete.');
      return;
    }

    if (confirm('Are you sure you want to delete this master data type?')) {
      this.apiService.deleteMasterData(id).subscribe({
        next: (res) => {
          if (res && res.success) {
            this.toastService.success('Master data type deleted successfully');
            this.selectedRecordId.set(null);
            this.loadMasterData();
          } else {
            this.toastService.error(res.message || 'Failed to delete master data type.');
          }
        },
        error: (err) => {
          console.error('Failed to delete master data type:', err);
          this.toastService.error('Failed to delete master data type.');
        }
      });
    }
  }

  addItemRow(): void {
    this.model.data = [
      ...this.model.data,
      { id: null as any, name: '', code: '' }
    ];
  }

  removeItemRow(index: number): void {
    this.model.data = this.model.data.filter((_, i) => i !== index);
  }

  cancelForm(): void {
    this.isFormMode = false;
    this.isEditMode = false;
    this.formSubmitted = false;
  }

  validateForm(): boolean {
    if (!this.model.master_type_id) {
      this.toastService.warning('Master Type ID is required.');
      return false;
    }
    if (!this.model.master_type_key?.trim()) {
      this.toastService.warning('Master Type Key is required.');
      return false;
    }
    if (!this.model.master_type_label?.trim()) {
      this.toastService.warning('Master Type Label is required.');
      return false;
    }

    // Validate sub-table items
    for (let i = 0; i < this.model.data.length; i++) {
      const item = this.model.data[i];
      if (item.id === null || item.id === undefined || isNaN(Number(item.id))) {
        this.toastService.warning(`Item #${i + 1}: Valid ID is required.`);
        return false;
      }
      if (!item.name?.trim()) {
        this.toastService.warning(`Item #${i + 1}: Name is required.`);
        return false;
      }
    }
    return true;
  }

  save(): void {
    this.formSubmitted = true;
    if (!this.validateForm()) {
      return;
    }

    // Format fields
    const payload = {
      master_type_id: Number(this.model.master_type_id),
      master_type_key: this.model.master_type_key.trim().toLowerCase(),
      master_type_label: this.model.master_type_label.trim(),
      status: this.model.status,
      data: this.model.data.map(item => ({
        id: Number(item.id),
        name: item.name.trim().toUpperCase(),
        code: item.code ? item.code.trim().toUpperCase() : undefined
      }))
    };

    if (this.isEditMode) {
      this.apiService.updateMasterData(this.model.id!, payload).subscribe({
        next: (res) => {
          if (res && res.success) {
            this.toastService.success('Master data updated successfully');
            this.isFormMode = false;
            this.loadMasterData();
          } else {
            this.toastService.error(res.message || 'Failed to update master data.');
          }
        },
        error: (err) => {
          console.error('Failed to update master data:', err);
          this.toastService.error(err.error?.message || 'Failed to update master data.');
        }
      });
    } else {
      this.apiService.createMasterData(payload).subscribe({
        next: (res) => {
          if (res && res.success) {
            this.toastService.success('Master data created successfully');
            this.isFormMode = false;
            this.loadMasterData();
          } else {
            this.toastService.error(res.message || 'Failed to create master data.');
          }
        },
        error: (err) => {
          console.error('Failed to create master data:', err);
          this.toastService.error(err.error?.message || 'Failed to create master data.');
        }
      });
    }
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  refreshList(): void {
    this.loadMasterData();
    this.toastService.success('Master data list refreshed successfully');
  }

  exportToCSV(): void {
    const data = this.masterDataList();
    if (data.length === 0) {
      this.toastService.warning('No data available to export');
      return;
    }

    const headers = ['ID', 'Master Type ID', 'Key', 'Label', 'Items Count', 'Status'];
    const rows = data.map(item => [
      item.id,
      item.master_type_id,
      `"${(item.master_type_key || '').replace(/"/g, '""')}"`,
      `"${(item.master_type_label || '').replace(/"/g, '""')}"`,
      item.data ? item.data.length : 0,
      `"${(item.status || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'crm_master_data_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toastService.success('Master data exported to CSV successfully');
  }
}
