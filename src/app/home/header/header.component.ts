import { Component, ElementRef, HostListener, OnInit, Renderer2 } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonService } from '../../shared/services/common.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'] // Make sure to use 'styleUrls'
})
export class HeaderComponent implements OnInit {
  mobileNavActive: boolean = false;
  activeSection: string = 'hero'; // Initial section
  uniqueId: string = '';
  queryStatusMessage: string = '';
  isSearchExpanded: boolean = false;

  constructor(private renderer: Renderer2,
     private elementRef: ElementRef, 
     private snackBar: MatSnackBar,
     private commonService: CommonService,
    ) {}

  ngOnInit(): void {
    this.addClickListeners();
    this.scrollToTop();
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(event: Event): void {
    if (window.scrollY > 100) {
      this.renderer.addClass(this.elementRef.nativeElement.querySelector('.header'), 'scrolled');
      this.renderer.addClass(this.elementRef.nativeElement.querySelector('.scroll-top'), 'active');
    } else {
      this.renderer.removeClass(this.elementRef.nativeElement.querySelector('.header'), 'scrolled');
      this.renderer.removeClass(this.elementRef.nativeElement.querySelector('.scroll-top'), 'active');
    }
    this.detectSectionInView(); // Update active section on scroll
  }

  private addClickListeners(): void {
    const faqItems = this.elementRef.nativeElement.querySelectorAll('.faq-item h3, .faq-item .faq-toggle');
    faqItems.forEach((faqItem: { parentNode: { classList: { toggle: (arg0: string) => void; }; }; }) => {
      this.renderer.listen(faqItem, 'click', () => {
        faqItem.parentNode.classList.toggle('faq-active');
      });
    });
  }

  

  toggleSearchInput(): void {
    this.isSearchExpanded = !this.isSearchExpanded;
  }

  toggleMobileNav() {
    this.mobileNavActive = !this.mobileNavActive;

    if (this.mobileNavActive) {
      this.renderer.addClass(document.body, 'mobile-nav-active');  // Add class to body to avoid conflicts with scroll
    } else {
      this.renderer.removeClass(document.body, 'mobile-nav-active');
    }
  }

  closeMobileNav() {
    this.mobileNavActive = false;
    this.renderer.removeClass(document.body, 'mobile-nav-active');
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Detect current section in view
  detectSectionInView(): void {
    const sections = ['hero', 'about', 'services', 'recent-posts', 'contact'];
    sections.forEach(sectionId => {
      const sectionElement = document.getElementById(sectionId);
      if (sectionElement) {
        const rect = sectionElement.getBoundingClientRect();
        if (rect.top <= 80 && rect.bottom >= 80) {
          this.activeSection = sectionId;
        }
      }
    });
  }

  showSuccessNotification(message: string, ) {
    this.snackBar.open(message, 'Close', {
      duration: 50000,
      panelClass: ['snackbar-success']
    });
  }

  showErrorNotification(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['snackbar-error']
    });
  }


  checkQueryStatus(): void {
    if (!this.uniqueId) {
        // this.queryStatusMessage = 'Please enter a valid Query ID.';
        this.showErrorNotification('Please enter a valid Query ID.');
        return; // Early return if the unique ID is not provided
    }

    this.commonService.checkApplicationStatus(this.uniqueId).subscribe((res: any) => {
        if (res.success) {
            const applicationStatus = res.data.application_status;

            // Define user-friendly messages based on the application status
            switch (applicationStatus) {
                case 'Pending':
                    this.showSuccessNotification('Your query is currently pending. We will update you shortly.');
                    break;
                case 'Approved':
                    this.showSuccessNotification('Congratulations! Your query has been approved.');
                    break;
                case 'Rejected':
                    this.showErrorNotification('We regret to inform you that your query has been rejected. Please contact support for more details.');
                    break;
                default:
                    this.showErrorNotification('Status unknown. Please check your Query ID and try again.');
            }
        } else {
            this.showErrorNotification('Error: ' + res.message);
        }
    }, (error) => {
        this.showErrorNotification('An error occurred while checking the application status. Please try again later.');
    });
}

  
  

}
