import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ProductService } from '../../services/product.service';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss'
})
export class WelcomeComponent implements OnInit {
  totalClients = signal(0);
  pendingITR = signal(0);
  completedReturns = signal(0);
  activeGST = signal(0);
  totalRevenue = signal(0);
  isLoading = signal(false);
  
  // Mock data for recent cases/tasks
  recentCases = signal<any[]>([
    { id: '1', clientName: 'John Doe', serviceType: 'ITR Filing', status: 'In Progress', priority: 'High', date: new Date() },
    { id: '2', clientName: 'Jane Smith', serviceType: 'GST Return', status: 'Pending', priority: 'Medium', date: new Date(Date.now() - 86400000) },
    { id: '3', clientName: 'ABC Corp', serviceType: 'Tax Planning', status: 'Completed', priority: 'Low', date: new Date(Date.now() - 172800000) },
    { id: '4', clientName: 'XYZ Ltd', serviceType: 'GST Registration', status: 'In Progress', priority: 'High', date: new Date(Date.now() - 259200000) },
    { id: '5', clientName: 'Robert Johnson', serviceType: 'ITR Filing', status: 'Pending', priority: 'Medium', date: new Date(Date.now() - 345600000) }
  ]);
  
  // Mock data for recent services
  recentServices = signal<any[]>([
    { id: '1', clientName: 'John Doe', serviceType: 'ITR Filing', amount: 2500, status: 'Completed', date: new Date() },
    { id: '2', clientName: 'Jane Smith', serviceType: 'GST Return Filing', amount: 1500, status: 'Completed', date: new Date(Date.now() - 86400000) },
    { id: '3', clientName: 'ABC Corp', serviceType: 'Tax Planning', amount: 5000, status: 'Completed', date: new Date(Date.now() - 172800000) },
    { id: '4', clientName: 'XYZ Ltd', serviceType: 'Business Registration', amount: 3000, status: 'In Progress', date: new Date(Date.now() - 259200000) },
    { id: '5', clientName: 'Robert Johnson', serviceType: 'Accounting Services', amount: 4000, status: 'Completed', date: new Date(Date.now() - 345600000) },
    { id: '6', clientName: 'Sarah Williams', serviceType: 'Financial Planning', amount: 6000, status: 'Completed', date: new Date(Date.now() - 432000000) }
  ]);
  
  filteredCases = computed(() => {
    return this.recentCases();
  });
  
  filteredServices = computed(() => {
    return this.recentServices();
  });
  
  serviceStatusSummary = computed(() => {
    const total = this.totalClients();
    const completed = this.completedReturns();
    const inProgress = this.pendingITR();
    const pending = Math.max(total - completed - inProgress, 0);
    const safeTotal = Math.max(total, 1);

    return {
      total,
      completed,
      inProgress,
      pending,
      completedPct: Math.round((completed / safeTotal) * 100),
      inProgressPct: Math.round((inProgress / safeTotal) * 100),
      pendingPct: Math.round((pending / safeTotal) * 100)
    };
  });
  
  revenueSummary = computed(() => {
    const itrRevenue = this.totalRevenue() * 0.6; // 60% from ITR
    const gstRevenue = this.totalRevenue() * 0.4; // 40% from GST
    const total = this.totalRevenue();
    const safeTotal = total > 0 ? total : 1;

    return {
      itrRevenue,
      gstRevenue,
      total,
      itrPct: Math.round((itrRevenue / safeTotal) * 100),
      gstPct: Math.round((gstRevenue / safeTotal) * 100)
    };
  });

  constructor(
    public authService: AuthService,
    private apiService: ApiService,
    private productService: ProductService,
    private transactionService: TransactionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.productService.loadProducts();
    this.transactionService.loadTransactions();
  }

  loadStats(): void {
    this.isLoading.set(true);
    
    // Get stats for last 30 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Use dashboard stats API - adapt for tax services
    this.apiService.getDashboardStats(startDateStr, endDate).subscribe({
      next: (stats) => {
        // Map inventory stats to tax service stats
        this.totalClients.set(stats.totalProducts !== undefined ? stats.totalProducts : 45); // Total clients
        this.pendingITR.set(stats.lowStockCount !== undefined ? stats.lowStockCount : 12); // Pending ITR filings
        this.completedReturns.set(stats.completedReturns !== undefined ? stats.completedReturns : 32); // Completed returns
        this.activeGST.set(stats.activeGST !== undefined ? stats.activeGST : 18); // Active GST registrations
        this.totalRevenue.set(stats.totalSales !== undefined ? stats.totalSales : 125000); // Total revenue
        
        if (stats.recentCases && stats.recentCases.length > 0) {
          this.recentCases.set(stats.recentCases);
        }
        if (stats.recentServices && stats.recentServices.length > 0) {
          this.recentServices.set(stats.recentServices);
        }
        
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        // Fallback to mock data for tax services
        this.totalClients.set(45);
        this.pendingITR.set(12);
        this.completedReturns.set(32);
        this.activeGST.set(18);
        this.totalRevenue.set(125000);
        this.isLoading.set(false);
      }
    });
  }

  navigateToProducts(): void {
    this.router.navigate(['/products']);
  }

  navigateToServices(): void {
    this.router.navigate(['/sales/sales-invoice']);
  }

  navigateToCases(): void {
    this.router.navigate(['/crm/organisation']);
  }
  
  getPriorityClass(priority: string): string {
    switch(priority.toLowerCase()) {
      case 'high': return 'critical';
      case 'medium': return 'warning';
      default: return 'low';
    }
  }
  
  getStatusClass(status: string): string {
    switch(status.toLowerCase()) {
      case 'completed': return 'completed';
      case 'in progress': return 'in-progress';
      default: return 'pending';
    }
  }
}
