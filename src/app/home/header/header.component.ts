import {Component, ElementRef, HostListener, OnInit, Renderer2} from '@angular/core';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit{
  mobileNavActive: boolean = false;
  constructor(private renderer: Renderer2, private elementRef: ElementRef) {}
ngOnInit(): void {
  this.addClickListeners();

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


}

private addClickListeners(): void {
  const faqItems = this.elementRef.nativeElement.querySelectorAll('.faq-item h3, .faq-item .faq-toggle');
  faqItems.forEach((faqItem: { parentNode: { classList: { toggle: (arg0: string) => void; }; }; }) => {
    this.renderer.listen(faqItem, 'click', () => {
      faqItem.parentNode.classList.toggle('faq-active');
    });
  });
}


toggleMobileNav() {
  this.mobileNavActive = !this.mobileNavActive;
}

scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

}
