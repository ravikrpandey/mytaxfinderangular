import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar'; // Import MatSnackBar for notifications
import { CommonService } from '../../shared/services/common.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'], // Fixed 'styleUrl' to 'styleUrls'
})
export class HomeComponent {
  contactForm: FormGroup;
  submitted = false;
  message: string = 'Form is invalid';

  constructor(
    private fb: FormBuilder, 
    private commonService: CommonService, 
    private snackBar: MatSnackBar // Properly declare MatSnackBar in the constructor
  ) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  showSuccessNotification() {
    this.snackBar.open('Form submitted successfully!', 'Close', {
      duration: 5000,  // Duration in milliseconds
      panelClass: ['snackbar-success'] // Optional, for custom styling
    });
  }

  showErrorNotification(message: string) {  // Accept message as parameter
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['snackbar-error']
    });
  }

  onSubmit() {
    if (this.contactForm.valid) {
      this.commonService.submitForm(this.contactForm.value).subscribe(
        (response) => {
          this.showSuccessNotification();
          console.log('Form submission successful');
          this.contactForm.reset();
        },
        (error) => {
          console.log('Form submission error');
          this.showErrorNotification('An error occurred while submitting the form.');
        }
      );
      console.log(this.contactForm.value);
    } else {
      console.log('Form is invalid');
      this.showErrorNotification(this.message); // Use predefined message
    }
  }
}
