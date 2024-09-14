import { CommonService } from './../../shared/services/common.service';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-enquiry-form',
  templateUrl: './enquiry-form.component.html',
  styleUrls: ['./enquiry-form.component.scss']
})
export class EnquiryFormComponent {
  myForm: FormGroup;
  base64Files: string[] = [];

  constructor(private fb: FormBuilder, private commonService: CommonService) {
    this.myForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      documentType: ['', Validators.required],
      serviceType: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      uploadedfile: [[], Validators.required],  // Array to store multiple files
      contact: ['', Validators.required]
    });
  }

  // Handler for file input change event
  onFileChange(event: any) {
    const files = event.target.files;
    this.base64Files = []; // Clear previous files

    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.convertFileToBase64(file).then((base64: string) => {
          this.base64Files.push(base64);
          this.myForm.patchValue({
            uploadedfile: this.base64Files  // Update form control with base64 files
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
      console.log(this.myForm.value);

      this.commonService.enquiryForm(this.myForm.value).subscribe(
        (response) => {
          console.log('Form submitted successfully', response);
        },
        (error) => {
          console.log('Error occurred during form submission', error);
        }
      );
    } else {
      console.log('Form is invalid');
    }
  }
}
