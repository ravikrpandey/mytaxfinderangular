import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContactService } from '../../core/services/my-shared.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {

  contactForm: FormGroup;
  submitted = false;

  constructor(private fb: FormBuilder, private contactService: ContactService) {
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
          // Handle success response
        },
        error => {
          console.error('Error submitting form', error);
          // Handle error response
        }
      );

    } else {
      console.log('Form is invalid');
    }
  }
}
