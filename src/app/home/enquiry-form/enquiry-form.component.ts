import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonService } from './../../shared/services/common.service';

@Component({
  selector: 'app-enquiry-form',
  templateUrl: './enquiry-form.component.html',
  styleUrls: ['./enquiry-form.component.scss']
})
export class EnquiryFormComponent {
  myForm: FormGroup;
  formData: FormData = new FormData(); // FormData instance for file uploads
  selectedFiles: File[] = []; // Store selected files

  constructor(
    private fb: FormBuilder, 
    private commonService: CommonService, 
    private snackBar: MatSnackBar
  ) {
    this.myForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      serviceType: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      contact: ['', Validators.required]
    });
  }

  message = "Please fill in all the required fields."

  showSuccessNotification(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['snackbar-success']
    });
  }

  showErrorNotification(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['snackbar-error']
    });
  }

  // Handle file input change
  onFileChange(event: any) {
    if (event.target && event.target.files) {
      const files = event.target.files;
      if (files.length > 0) {
        this.selectedFiles = Array.from(files); // Convert FileList to an array
        console.log('Selected files:', this.selectedFiles);
      }
    }
  }  

  // Handle form submission
  onSubmit() {
    if (this.myForm.valid) {
      this.formData = new FormData(); // Reset FormData before appending

      // Append form fields to FormData
      ['firstName', 'lastName', 'serviceType', 'email', 'contact'].forEach(field => {
        const value = this.myForm.get(field)?.value;
        if (value) {
          this.formData.append(field, value);
        }
      });

      // Append files to FormData
      this.selectedFiles.forEach(file => {
        this.formData.append('files', file);
      });

      // Send form data to the backend
      this.commonService.enquiryForm(this.formData).subscribe(
        (response) => {
          this.showSuccessNotification(response.message);
          this.myForm.reset(); // Reset form
          this.selectedFiles = []; // Clear selected files
          this.formData = new FormData(); // Reset FormData
        },
        (error) => {
          console.error('Error:', error);
          this.showErrorNotification('An error occurred while submitting the form.');
        }
      );
    } else {
      this.showErrorNotification('Please fill all required fields.');
    }
  }

  // Cancel the form and navigate back
  cancel() {
    window.history.back();
  }
}
