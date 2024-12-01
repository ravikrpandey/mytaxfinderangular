import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonService } from '../../../../../shared/services/common.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { SharedModule } from '../../../../../shared/shared.module';
import { SharedService } from '../../../../../shared/services/shared.service';

@Component({
  selector: 'app-filed-queries',
  templateUrl: './filed-queries.component.html',
  styleUrls: ['./filed-queries.component.scss']
})
export class FiledQueriesComponent implements OnInit {

  message = 'Please fill in all the required fields.';
  rowData: any[] = [];
  gridApi: any; // Reference to ag-Grid API
  gridColumnApi: any;

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
    { headerName: 'Uploaded Files', field: 'files' },
    {
      headerName: 'Actions',
      field: 'actions',
      width: 150,
      cellRenderer: (params: { data: { id: any } }) => {
        // Create an edit icon as a button
        const button = document.createElement('button');
        button.innerHTML = `<i class="material-icons" style="cursor: pointer;">edit</i>`;
        button.style.background = 'none';
        button.style.border = 'none';
        button.style.cursor = 'pointer';

        // Add click event listener
        button.addEventListener('click', () => {
          this.onEditRow(params.data);
        });

        return button;
      }
    }
  ];

  gridOptions = {
    enableRangeSelection: true,
    enableClipboard: true,
    clipboardDelimiter: '\t', // Use proper spelling for 'delimiter'
    suppressClipboardPaste: true, // Prevent pasting back into the grid
  };

  constructor(
    private commonService: CommonService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.commonService.litEnquiry().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.rowData = res.data;
          this.cdr.detectChanges(); // Trigger change detection
          this.showSuccessNotification(res.message);
        } else {
          this.showErrorNotification('Failed to load data.');
        }
      },
      error: () => {
        this.showErrorNotification('An error occurred while fetching data.');
      }
    });
  }

  onEditRow(data: any): void {
    this.sharedService.setQueryData(data);
    this.router.navigate(['/admin/queries/edit-filed-queries'], { state: { queryData: data } });
    console.log('Edit row data:', data);
    // Add additional logic for handling the edit action, such as opening a modal if needed
  }  

  onGridReady(params: any): void {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    console.log('Grid API initialized:', this.gridApi);
    this.gridApi.setRowData(this.rowData);
  }

  onSearchChanged(event: any): void {
    const searchValue = event.target.value;
    if (this.gridApi) {
      this.gridApi.setQuickFilter(searchValue);
    } else {
      console.error('Grid API is not initialized yet');
    }
  }

  showSuccessNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 2000,
      panelClass: ['snackbar-success']
    });
  }

  showErrorNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['snackbar-error']
    });
  }
}
