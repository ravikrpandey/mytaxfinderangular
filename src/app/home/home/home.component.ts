import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContactService } from '../../core/services/my-shared.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {

  contactForm: FormGroup;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService,
    private toastr: ToastrService  // Inject ToastrService
  ) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  onSubmit() {
    this.submitted = true;
    if (this.contactForm.valid) {
      console.log(this.contactForm.value);

      this.contactService.postContactForm(this.contactForm.value).subscribe(
        response => {
          console.log('Form submitted successfully', response);
          this.toastr.success('Your message has been sent successfully!', 'Success');
          // Handle success response
        },
        error => {
          console.error('Error submitting form', error);
          this.toastr.error('There was an error sending your message. Please try again.', 'Error');
          // Handle error response
        }
      );

    } else {
      console.log('Form is invalid');
      this.toastr.warning('Please fill out all required fields.', 'Form Incomplete');
    }
  }
}
