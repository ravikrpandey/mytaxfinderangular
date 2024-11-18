import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonService } from '../../../../../shared/services/common.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-filed-queries',
  templateUrl: './filed-queries.component.html',
  styleUrls: ['./filed-queries.component.scss']
})
export class FiledQueriesComponent implements OnInit {

  constructor(private commonService: CommonService, private snackBar: MatSnackBar, private cdr: ChangeDetectorRef) {}

  message = "Please fill in all the required fields.";
  rowData: any[] = [];

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
    { headerName: 'Updated At', field: 'updatedAt' }
  ];

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
