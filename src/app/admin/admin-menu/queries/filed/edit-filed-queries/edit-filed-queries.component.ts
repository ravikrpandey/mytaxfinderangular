import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from '../../../../../shared/services/common.service';
import { SharedService } from '../../../../../shared/services/shared.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-edit-filed-queries',
  templateUrl: './edit-filed-queries.component.html',
  styleUrls: ['./edit-filed-queries.component.scss']
})
export class EditFiledQueriesComponent implements OnInit {
  editForm!: FormGroup;
  queryId!: number;
  queryData: any;
  uploadedFiles: string[] = []; // Array to hold file URLs
  selectedFile: string | null = null; // To hold selected file for viewing
  previewFile: string | null = null;

  constructor(
    private fb: FormBuilder,
    private commonService: CommonService,
    private route: ActivatedRoute,
    private router: Router,
    private sharedService: SharedService,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.queryId = this.route.snapshot.params['id'];

    // Retrieve data from shared service
    const queryData = this.sharedService.getQueryData();

    if (queryData) {
      this.initializeForm(queryData);
      // Handle files as an object or array
      this.uploadedFiles = Array.isArray(queryData.files)
        ? queryData.files
        : Object.values(queryData.files);
    } else {
      console.error('No data received for editing');
      this.router.navigate(['/queries']); // Navigate back if no data is passed
    }
  }

  /**
   * Initialize the form with data for editing.
   * @param data - The query data to populate the form.
   */
  initializeForm(data: any): void {
    this.editForm = this.fb.group({
      firstName: [data.firstName, [Validators.required]],
      lastName: [data.lastName, [Validators.required]],
      serviceType: [data.serviceType, [Validators.required]],
      email: [data.email, [Validators.required, Validators.email]],
      contact: [data.contact, [Validators.required]],
      status: [data.status, [Validators.required]],
      application_status: [data.application_status, [Validators.required]],
      ref_number: [data.ref_number, [Validators.required]]
    });
  }

  isImage(fileUrl: string): boolean {
    return fileUrl.match(/\.(jpeg|jpg|png)$/i) !== null;
  }
  
  isDocument(fileUrl: string): boolean {
    return fileUrl.match(/\.(pdf|docx|doc)$/i) !== null;
  }
  
  // Function to handle document icons based on the file type
  getDocumentIcon(fileUrl: string): string {
    if (fileUrl.match(/\.pdf$/i)) {
      return 'fa-file-pdf'; // PDF Icon
    } else if (fileUrl.match(/\.docx$/i) || fileUrl.match(/\.doc$/i)) {
      return 'fa-file-word'; // Word document icon
    }
    return 'fa-file'; // Default icon if no match is found
  }
  
  showPreview(fileUrl: string): void {
    if (this.isImage(fileUrl)) {
      this.previewFile = fileUrl; // Only show preview for images
    }
  }
  
  hidePreview(): void {
    this.previewFile = null;
  }
  


  onSubmit(): void {
    debugger
    if (this.editForm.valid) {
      const updatedQueryData = this.editForm.value;
      // Uncomment the API call when implementing backend
      this.commonService.updateQuery(this.queryId, updatedQueryData).subscribe(response => {
        if (response.success === true) {
          this.showSuccessNotification(response.message)
          setInterval(() => {
            this.router.navigate(['/admin/queries/list-filed']);
          }, 5000);
        } else {
          this.showErrorNotification(response.message)
        }
      });
    }
  }

  /**
   * Getter for form controls.
   */
  get f() {
    return this.editForm.controls;
  }

  showSuccessNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
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
