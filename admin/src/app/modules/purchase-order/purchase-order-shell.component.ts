import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-purchase-order-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <router-outlet />
  `,
  styles: [
    `
      .po-shell {
        padding: 1.5rem 2rem;
        background: #f3f4f6;
        min-height: calc(100vh - 56px);
      }

      .po-shell-inner {
        max-width: 1350px;
        // margin: 0 auto;
      }

      .po-header {
        margin-bottom: 1.25rem;
      }

      .po-header-title {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 600;
        color: #0f172a;
      }

      .po-header-subtitle {
        margin: 0.35rem 0 0;
        font-size: 0.9rem;
        color: #64748b;
      }

      .po-nav {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.25rem;
        padding: 0.25rem;
        background: #e5e7eb;
        border-radius: 999px;
      }

      .po-nav-link {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 0.55rem 0.9rem;
        text-decoration: none;
        border-radius: 999px;
        color: #0f172a;
        transition:
          background 0.15s ease,
          color 0.15s ease,
          box-shadow 0.15s ease,
          transform 0.1s ease;
      }

      .po-nav-link:hover {
        background: #f9fafb;
        transform: translateY(-1px);
        box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);
      }

      .po-nav-link.active {
        background: #ffffff;
        box-shadow:
          0 0 0 1px rgba(148, 163, 184, 0.4),
          0 10px 25px rgba(15, 23, 42, 0.15);
        color: var(--theme-primary, #06b6d4);
      }

      .po-nav-label {
        font-size: 0.85rem;
        font-weight: 600;
      }

      .po-nav-caption {
        font-size: 0.75rem;
        color: #64748b;
      }

      .po-content {
        min-height: 280px;
        padding-top: 0.5rem;
      }
    `
  ]
})
export class PurchaseOrderShellComponent {}
