import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';

import { DashboardService } from '../../../../core/services/dashboard.service';
import { DashboardSummary } from '../../../../core/models/dashboard-summary.model';
import { ReportSummary } from '../../../../core/models/report-summary.model';
import { Order } from '../../../../core/models/order.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChartModule, ProgressSpinnerModule, TagModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  summary: DashboardSummary = {
    totalOrders: 0,
    activeTables: 0,
    availableMenuItems: 0,
    totalSales: 0
  };

  revenueSummary: ReportSummary = {
    totalOrders: 0,
    activeTables: 0,
    paidRevenue: 0,
    unpaidServedOrders: 0,
    totalPayments: 0,
    cashPayments: 0,
    cardPayments: 0,
    qrPayments: 0
  };

  recentOrders: Order[] = [];
  mostOrderedItem = 'N/A';
  loading = false;

  revenueChartData: any;
  revenueChartOptions: any;

  paymentChartData: any;
  paymentChartOptions: any;

  constructor(private dashboardService: DashboardService ,private rdf:ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadDashboard();
    
  }

  loadDashboard(): void {
    this.loading = true;

    let completedCalls = 0;
    const totalCalls = 4;

    const markComplete = () => {
      completedCalls++;
      this.rdf.detectChanges();
      if (completedCalls === totalCalls) {
        this.loading = false;
      }
    };

    this.dashboardService.getSummary().subscribe({
      next: (summary) => {
        this.summary = summary;
        this.initCharts();
        markComplete();
      },
      error: (error) => {
        console.error('Failed to load dashboard summary', error);
        markComplete();
      }
    });

    this.dashboardService.getRevenueSummary().subscribe({
      next: (summary) => {
        this.revenueSummary = summary;
        this.initCharts();
        markComplete();
      },
      error: (error) => {
        console.error('Failed to load revenue summary', error);
        markComplete();
      }
    });

    this.dashboardService.getRecentOrders().subscribe({
      next: (orders) => {
        this.recentOrders = orders;
        markComplete();
        
      },
      error: (error) => {
        console.error('Failed to load recent orders', error);
        markComplete();
      }
    });

    this.dashboardService.getMostOrderedItem().subscribe({
      next: (item) => {
        this.mostOrderedItem = item || 'N/A';
        markComplete();
        this.rdf.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load most ordered item', error);
        markComplete();
      }
    });
  }

  initCharts(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#334155';
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#64748b';
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#e2e8f0';

    this.revenueChartData = {
      labels: ['Orders', 'Payments', 'Active Tables', 'Available Items'],
      datasets: [
        {
          label: 'Restaurant Overview',
          data: [
            this.summary.totalOrders,
            this.revenueSummary.totalPayments,
            this.summary.activeTables,
            this.summary.availableMenuItems
          ],
          borderRadius: 10
        }
      ]
    };

    this.revenueChartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 1.8,
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        }
      }
    };

    this.paymentChartData = {
      labels: ['Cash', 'Card', 'QR Payment'],
      datasets: [
        {
          data: [
            this.revenueSummary.cashPayments,
            this.revenueSummary.cardPayments,
            this.revenueSummary.qrPayments
          ],
          hoverOffset: 6
        }
      ]
    };

    this.paymentChartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 1,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            usePointStyle: true
          }
        }
      }
    };
  }

  getOrderSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch ((status || '').toLowerCase()) {
      case 'paid':
      case 'served':
        return 'success';
      case 'ready':
        return 'info';
      case 'preparing':
        return 'warn';
      case 'pending':
        return 'danger';
      default:
        return 'secondary';
    }
  }
}