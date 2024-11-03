import { AfterViewInit, Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonService } from '../../shared/services/common.service';

declare let PureCounter: any; // Declare PureCounter for use in the component

interface Faq {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements AfterViewInit {
  contactForm: FormGroup;
  submitted = false;
  message: string = 'Form is invalid';
  expandedIndex: number | null = null;
  email: string = '';

  faqs: Faq[] = [
    {
      question: "What is e-Filing of income tax return (ITR)?",
      answer: `Individuals, except senior citizens, have to mandatorily file the ITR through the online mode which
                is also known as electronic filing, i.e. e-filing of the income tax return.
                An income tax return is a form that a person is required to submit to the Income Tax Department. It
                contains information related to individual’s income and taxes paid, starting from 1st April to 31st
                March of the financial year. There are seven ITR forms prescribed by the Income Tax Department
                according to the amount of income, income source and the category to which the taxpayer belongs.`
    },
    {
      question: "Who should file an ITR?",
      answer: `Any individual whose total income before deductions exceeds the basic exemption limit is required
                to file an ITR. The exemption limit can vary based on age and other factors.`
    },
    {
      question: "How can you file an income tax return in India?",
      answer: `You can file your income tax returns online, either on the income tax department’s website or with
                us at www.MyTaxFinder.com. Income Tax filing or e-filing is made easy on MyTaxFinder. You can e-file your returns with us. Also, note
                that the due date to e-file your income tax returns for the assessment year 2023-24 is on or before 31st July 2023.`
    },
    {
      question: "How can I claim deductions for tax saving?",
      answer: `To claim these deductions, individuals need to declare them while filing their Income Tax Return
                (ITR). It's important to keep proper documentation, such as investment receipts, premium payment receipts, and
                loan statements, to substantiate the claims.`
    },
    {
      question: "How to e-verify my ITR?",
      answer: `To e-verify your Income Tax Return (ITR) in India, you can choose from several methods.
                E-verification is a convenient and secure way to confirm the authenticity of your ITR filing. E-verify via Net Banking,
                E-verify via Aadhaar OTP, E-verify via Bank ATM, E-verify via Bank Account, E-verify via Electronic
                Verification Code (EVC).`
    }
  ];

  constructor(
    private fb: FormBuilder,
    private commonService: CommonService,
    private snackBar: MatSnackBar
  ) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (typeof PureCounter !== 'undefined') {
        new PureCounter();
        this.addPlusSign();
        window.addEventListener('scroll', this.onScroll);
        setTimeout(() => {
          this.addPlusSign();
        }, 8000);
      } else {
        console.error('PureCounter library not available on window');
      }
  
      // Check for hash in URL and scroll to the corresponding section if it exists
      const hash = window.location.hash;
      if (hash) {
        this.scrollToSection(hash);
      }
    }, 100);
  }
  
  
  scrollToSection(hash: string): void {
    const element = document.querySelector(hash);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  

  addPlusSign() {
    // Select all purecounter elements and append the '+' sign only if it does not already exist
    const counters = document.querySelectorAll('.purecounter');
    counters.forEach(counter => {
      // Check if the '+' sign already exists
      if (!counter.innerHTML.includes('+')) {
        counter.innerHTML += '+'; // Append the '+' sign to the inner HTML only if it's not there
      }
    });
  }
  

  onScroll = () => {
    // Re-add '+' sign on scroll (if necessary)
    this.addPlusSign();
  };
  
  ngOnDestroy() {
    // Clean up the event listener
    window.removeEventListener('scroll', this.onScroll);
  }

  toggleAnswer(index: number): void {
    // Toggle the expanded index for the FAQ
    this.expandedIndex = this.expandedIndex === index ? null : index;
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
    } else {
      console.log('Form is invalid');
      this.showErrorNotification(this.message);
    }
  }

  submitEmail() {
    if (this.isValidEmail(this.email)) {
      // Open the default mail application with the email address
      window.location.href = `mailto:mytaxfinder@hotmail.com?subject=E-File Now&body=Please reach out to us at ${this.email}`;
    } else {
      // Optional: Alert the user or log an error
      alert('Please enter a valid email address.');
    }
  }

  isValidEmail(email: string): boolean {
    // Simple email validation
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }


  
}


