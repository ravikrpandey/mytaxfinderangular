import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonService } from '../../../../../shared/services/common.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActionCellRendererComponent } from '../../../../../shared/components/action-cell-renderer/action-cell-renderer.component';

@Component({
  selector: 'app-filed-queries',
  templateUrl: './filed-queries.component.html',
  styleUrls: ['./filed-queries.component.scss']
})
export class FiledQueriesComponent implements OnInit {

  constructor(private commonService: CommonService, private snackBar: MatSnackBar, private cdr: ChangeDetectorRef) {}

  message = "Please fill in all the required fields.";
  rowData: any[] = [];

  frameworkComponents = {
    actionCellRenderer: ActionCellRendererComponent
  };

  columnDefs = [
    { headerName: 'ID', field: 'id' },
    { headerName: 'First Name', field: 'firstName' },
    { headerName: 'Last Name', field: 'lastName' },
    { headerName: 'Service Type', field: 'serviceType' },
    { headerName: 'Email', field: 'email' },
    { headerName: 'Contact', field: 'contact' },
    { headerName: 'Status', field: 'status' },
    { headerName: 'Application Status', field: 'application_status' },
    { headerName: 'Ref Number', field: 'ref_number' },
    { headerName: 'Created At', field: 'createdAt' },
    { headerName: 'Updated At', field: 'updatedAt' },
    {
      headerName: 'Actions',
      field: 'actions',
      cellRenderer: 'actionCellRenderer',
      width: 150, // Optional: Adjust the column width
    }
  ];

  onEditRow(data: any) {
    console.log('Edit row data:', data);
    // Navigate to the edit page or open a modal for editing
  }

  gridOptions = {
    context: {
      componentParent: this,
    },
  };
  
  

  // Reference to ag-Grid API for filtering
  gridApi: any;
  gridColumnApi: any;

  ngOnInit() {
    this.litEnquiry();
    this.fetchData();
    this.rowData = [];
  }

  fetchData() {
    this.commonService.litEnquiry().subscribe((res: any) => {
      this.rowData = res.data;
      this.cdr.detectChanges();  // Manually trigger change detection
    });
  }

  // Fetch data and populate the grid
  litEnquiry() {
    this.commonService.litEnquiry().subscribe((res: any) => {
      if (res.success) {
        this.rowData = res.data;
        this.cdr.detectChanges();
        this.showSuccessNotification(res.message);
      } else {
        this.showErrorNotification('Failed to load data.');
      }
    }, (error) => {
      this.showErrorNotification('An error occurred while fetching data.');
    });
  }

  

  // Show success notification
  showSuccessNotification(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 2000,
      panelClass: ['snackbar-success']
    });
  }

  // Show error notification
  showErrorNotification(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['snackbar-error']
    });
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    console.log('Grid API initialized:', this.gridApi);
    this.gridApi.setRowData(this.rowData); 
  }


  // Method to apply filter based on search input
  onSearchChanged(event: any) {
    const searchValue = event.target.value;
    if (this.gridApi) {
      this.gridApi.setQuickFilter(searchValue);
    } else {
      console.log("gridApi is not initialized yet");
    }
  }
}
