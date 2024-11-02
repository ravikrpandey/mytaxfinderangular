import { Component } from '@angular/core';

@Component({
  selector: 'app-tax-by-region',
  templateUrl: './tax-by-region.component.html',
  styleUrls: ['./tax-by-region.component.scss']
})
export class TaxByRegionComponent {
  toggleAccordion(event: MouseEvent): void {
    const button = event.currentTarget as HTMLButtonElement;
    const body = button.nextElementSibling as HTMLElement;

    // Close other open bodies
    const allBodies = document.querySelectorAll('.accordion-body');
    allBodies.forEach(item => {
      const itemBody = item as HTMLElement; // Cast to HTMLElement
      if (itemBody !== body) {
        itemBody.style.display = 'none'; // Hide other bodies
      }
    });

    // Toggle the clicked body
    if (body) {
      body.style.display = body.style.display === 'block' ? 'none' : 'block';
    }
  }
}
