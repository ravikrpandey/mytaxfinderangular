import { CommonService } from './../../shared/services/common.service';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-enquiry-form',
  templateUrl: './enquiry-form.component.html',
  styleUrls: ['./enquiry-form.component.scss']
})
export class EnquiryFormComponent {
  myForm: FormGroup;
  base64Files: string[] = [];

  constructor(private fb: FormBuilder, private commonService: CommonService, private snackBar: MatSnackBar) {
    this.myForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      serviceType: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      files: [[], Validators.required],
      contact: ['', Validators.required]
    });
  }

  showSuccessNotification() {
    this.snackBar.open('Form submitted successfully!', 'Close', {
      duration: 5000,  // Duration in milliseconds
      panelClass: ['snackbar-success'] // Optional, for custom styling
    });
  }

  showErrorNotification() {
    this.snackBar.open('An error occurred!', 'Close', {
      duration: 3000,
      panelClass: ['snackbar-error']
    });
  }

  // Handler for file input change event
  onFileChange(event: any) {
    const files = event.target.files;
    this.base64Files = [];

    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.convertFileToBase64(file).then((base64: string) => {
          this.base64Files.push(base64);
          this.myForm.patchValue({
            files: this.base64Files
          });
        });
      }
    }
  }

  // Convert the file to Base64
  convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string); // This will give base64 encoded string
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);  // Convert file to base64 format
    });
  }

  onSubmit() {
    if (this.myForm.value) {
      this.commonService.enquiryForm(this.myForm.value).subscribe(
        (response) => {
          this.showSuccessNotification();
          console.log("success")
          this.myForm.reset();
          this.base64Files = [];
        },
        (error) => {
          console.log("error")
          this.showErrorNotification();
        }
      );
    } else {
      console.log("error")
      this.showErrorNotification();
    }
  };

  cancel() {
  window.history.back();
  }
}


