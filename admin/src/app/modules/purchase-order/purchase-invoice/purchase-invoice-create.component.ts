import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-purchase-invoice-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="pi-create-page">
      <div class="pi-toolbar">
        <h2 class="pi-toolbar-title">CREATE PURCHASE INVOICE</h2>
      </div>

      <form [formGroup]="form" class="pi-form">
        <div class="pi-form-row">
          <div class="pi-form-field">
            <label>Invoice No</label>
            <input type="text" formControlName="invoiceNo" />
          </div>
          <div class="pi-form-field">
            <label>Invoice Date</label>
            <input type="date" formControlName="invoiceDate" />
          </div>
          <div class="pi-form-field">
            <label>Supplier</label>
            <input type="text" formControlName="supplier" />
          </div>
        </div>

        <div class="pi-form-row">
          <div class="pi-form-field">
            <label>Order No</label>
            <input type="text" formControlName="orderNo" />
          </div>
          <div class="pi-form-field">
            <label>Currency</label>
            <input type="text" formControlName="currency" />
          </div>
        </div>

        <div class="pi-form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid">Save</button>
          <button type="button" class="btn btn-secondary" (click)="form.reset()">Reset</button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .pi-create-page {
        background: #ffffff;
        border-radius: 6px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        padding: 12px 14px 16px;
      }

      .pi-toolbar {
        padding-bottom: 8px;
        border-bottom: 1px solid #e2e8f0;
        margin-bottom: 12px;
      }

      .pi-toolbar-title {
        margin: 0;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.5px;
      }

      .pi-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
        font-size: 12px;
      }

      .pi-form-row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .pi-form-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 200px;
        flex: 1;
      }

      .pi-form-field label {
        font-weight: 500;
      }

      .pi-form-field input {
        padding: 6px 10px;
        border-radius: 4px;
        border: 1px solid #cbd5e0;
        font-size: 12px;
      }

      .pi-form-actions {
        display: flex;
        gap: 8px;
        margin-top: 8px;
      }

      .btn {
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        border: 1px solid transparent;
      }

      .btn-primary {
        background: var(--theme-primary, #06b6d4);
        color: #fff;
        border-color: var(--theme-primary, #06b6d4);
      }

      .btn-secondary {
        background: #ffffff;
        border-color: #cbd5e0;
        color: #2d3748;
      }
    `
  ]
})
export class PurchaseInvoiceCreateComponent {
  form: FormGroup;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      invoiceNo: ['', Validators.required],
      invoiceDate: ['', Validators.required],
      supplier: ['', Validators.required],
      orderNo: [''],
      currency: ['INR']
    });
  }
}

