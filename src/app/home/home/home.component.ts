import {Component} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonService } from '../../shared/services/common.service';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',

})
export class HomeComponent {

  contactForm: FormGroup;
  submitted = false;

  constructor(private fb: FormBuilder, private commonService: CommonService) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

//   onSubmit() {
//     debugger;
//     this.submitted = true;
//     if (this.contactForm.valid) {
//       console.log(this.contactForm.value);
//       // Handle form submission here
//     } else {
//       console.log('Form is invalid');
//     }
//   }

// }




onSubmit() {
  debugger;
  if (this.contactForm.valid) {
    this.commonService.submitForm(this.contactForm.value).subscribe(
      (response) => {
        // Handle the response from the server here
        console.log('Form submitted successfully', response);
      },
      (error) => {
        // Handle any errors that occur during the submission
        console.log('Error occurred during form submission', error);
      }
    );
    console.log(this.contactForm.value);
    // Handle additional logic if needed
  } else {
    console.log('Form is invalid');
  }
}
}






