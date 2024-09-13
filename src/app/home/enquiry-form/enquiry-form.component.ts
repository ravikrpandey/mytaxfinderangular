import { CommonService } from './../../shared/services/common.service';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-enquiry-form',
  templateUrl: './enquiry-form.component.html',
  styleUrls: ['./enquiry-form.component.scss'] // Corrected the key from styleUrl to styleUrls
})
export class EnquiryFormComponent {
  myForm: FormGroup;

  constructor(private fb: FormBuilder, private commonService: CommonService) { // Corrected injection here

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
      this.commonService.submitForm(this.myForm.value).subscribe(
        (response) => {
          // Handle the response from the server here
          console.log('Form submitted successfully', response);
        },
        (error) => {
          // Handle any errors that occur during the submission
          console.log('Error occurred during form submission', error);
        }
      );
      console.log(this.myForm.value);
      // Handle additional logic if needed
    } else {
      console.log('Form is invalid');
    }
  }
}
