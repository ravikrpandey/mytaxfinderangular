import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-enquiry-form',
  templateUrl: './enquiry-form.component.html',
  styleUrls: ['./enquiry-form.component.scss'] // Corrected the key from styleUrl to styleUrls
})
export class EnquiryFormComponent {
  myForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.myForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      documentType: ['', Validators.required],
      serviceType: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      uploadedfile: ['', Validators.required],
      contact: ['', Validators.required]
    });
  }

  onSubmit() {
    debugger;
    if (this.myForm.valid) {
      console.log(this.myForm.value);
      // Handle the form submission logic here, e.g., send the data to a server
    } else {
      console.log('Form is invalid');
    }
  }
}
