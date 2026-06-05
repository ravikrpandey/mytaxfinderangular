import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-purchase-return',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="po-generic">
      <header class="po-generic-header">
        <h2>Purchase Return</h2>
        <p>Track and process purchase returns from your suppliers.</p>
      </header>
      <div class="po-generic-body">
        <p>This section is ready for your purchase return workflow.</p>
      </div>
    </section>
  `,
  styles: [
    `
      .po-generic {
        background: #ffffff;
        border-radius: 1rem;
        padding: 1.25rem 1.5rem;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      }

      .po-generic-header h2 {
        margin: 0 0 0.25rem;
        font-size: 1.1rem;
        font-weight: 600;
        color: #0f172a;
      }

      .po-generic-header p {
        margin: 0;
        font-size: 0.85rem;
        color: #64748b;
      }

      .po-generic-body {
        margin-top: 0.75rem;
        font-size: 0.9rem;
        color: #4b5563;
      }
    `
  ]
})
export class PurchaseReturnComponent {}

