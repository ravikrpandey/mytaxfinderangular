import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Invoice, InvoiceService } from '../services/invoice.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-invoice-listing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-listing.component.html',
  styleUrl: './invoice-listing.component.scss'
})
export class InvoiceListingComponent implements OnInit {
  invoices = signal<Invoice[]>([]);
  filteredInvoices = signal<Invoice[]>([]);
  searchTerm = signal('');
  filterStatus = signal<string>('all');
  isLoading = signal(false);

  constructor(
    public authService: AuthService,
    private router: Router,
    private invoiceService: InvoiceService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.isLoading.set(true);
    
    this.invoiceService.getInvoices().subscribe({
      next: (invoices) => {
        this.invoices.set(invoices);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load invoices:', err);
        this.isLoading.set(false);
        this.toastService.error('Failed to load invoices');
        // Fallback to empty array
        this.invoices.set([]);
        this.applyFilters();
      }
    });
  }

  applyFilters(): void {
    let filtered = this.invoices();

    // Apply search filter
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(term) ||
        invoice.customerName.toLowerCase().includes(term) ||
        invoice.customerGSTIN.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (this.filterStatus() !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === this.filterStatus());
    }

    this.filteredInvoices.set(filtered);
  }

  createNewInvoice(): void {
    this.router.navigate(['/invoices/create']);
  }

  editInvoice(invoice: Invoice): void {
    this.router.navigate(['/invoices/create'], { queryParams: { id: invoice.id } });
  }

  viewInvoice(invoice: Invoice): void {
    this.router.navigate(['/invoices/create'], { queryParams: { id: invoice.id, mode: 'view' } });
  }

  viewInvoicePreview(invoice: Invoice): void {
    this.router.navigate(['/invoices/create'], { queryParams: { id: invoice.id, mode: 'view', preview: '1' } });
  }

  deleteInvoice(invoice: Invoice): void {
    if (confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
      if (!invoice.id) return;
      
      this.invoiceService.deleteInvoice(invoice.id).subscribe({
        next: () => {
          const updated = this.invoices().filter(inv => inv.id !== invoice.id);
          this.invoices.set(updated);
          this.applyFilters();
          this.toastService.success('Invoice deleted successfully');
        },
        error: (err) => {
          console.error('Failed to delete invoice:', err);
          this.toastService.error('Failed to delete invoice. Please try again.');
        }
      });
    }
  }

  getStatusClass(status: string | undefined): string {
    return `status-${status || 'draft'}`;
  }

  navigateToWelcome(): void {
    this.router.navigate(['/welcome']);
  }
}
