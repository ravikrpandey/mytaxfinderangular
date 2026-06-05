import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PurchaseOrderService } from '../services/purchase-order.service';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_EXTENSIONS = '.pdf,.jpg,.jpeg,.png';

@Component({
  selector: 'app-purchase-order-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './purchase-order-upload.component.html',
  styleUrl: './purchase-order-upload.component.scss'
})
export class PurchaseOrderUploadComponent {
  uploading = false;
  error: string | null = null;
  selectedFile: File | null = null;
  isDragOver = false;

  readonly allowedExtensions = ALLOWED_EXTENSIONS;
  readonly maxSizeMb = MAX_FILE_SIZE_BYTES / (1024 * 1024);

  constructor(
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly router: Router
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    this.handleIncomingFile(file, input ?? undefined);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.uploading) {
      return;
    }
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    if (this.uploading) {
      return;
    }
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0] ?? null;
    this.handleIncomingFile(file);
  }

  private handleIncomingFile(file: File | null, input?: HTMLInputElement): void {
    this.error = null;
    this.selectedFile = null;

    if (!file) {
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      this.error = `Invalid file type. Allowed: PDF, JPG, PNG.`;
      if (input) {
        input.value = '';
      }
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.error = `File too large. Maximum size is ${this.maxSizeMb}MB.`;
      if (input) {
        input.value = '';
      }
      return;
    }

    this.selectedFile = file;
  }

  removeFile(): void {
    this.selectedFile = null;
    this.error = null;
  }

  onSubmit(): void {
    if (!this.selectedFile) {
      this.error = 'Please select an invoice file (PDF, JPG or PNG).';
      return;
    }

    this.uploading = true;
    this.error = null;

    this.purchaseOrderService.uploadInvoice(this.selectedFile).subscribe({
      next: (res) => {
        this.uploading = false;
        const invoiceId = res?.invoiceId;
        if (invoiceId) {
          // Immediately navigate to review; backend will create/get draft for this invoiceId
          this.router.navigate(['/po/review', String(invoiceId)]);
        } else {
          this.error = 'Upload succeeded but invoiceId was not returned.';
        }
      },
      error: (err) => {
        this.uploading = false;
        this.error =
          (err as Error)?.message ??
          (err as any)?.error?.message ??
          (err as any)?.error?.error ??
          'Upload failed. Please try again.';
      }
    });
  }
}
