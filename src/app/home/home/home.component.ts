import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonService } from '../../shared/services/common.service';
import { ActivatedRoute } from '@angular/router';
import { ViewportScroller } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  contactForm: FormGroup;
  submitted = false;
  message: string = 'Form is invalid';

  constructor(
    private fb: FormBuilder,
    private commonService: CommonService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private viewportScroller: ViewportScroller
  ) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.fragment.subscribe((fragment) => {
      if (fragment) {
        this.viewportScroller.scrollToAnchor(fragment);
      }
    });
  }

  showSuccessNotification() {
    this.snackBar.open('Form submitted successfully!', 'Close', {
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
      this.showErrorNotification(this.message);
    }
  }
}
