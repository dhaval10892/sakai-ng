import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ChartModule } from 'primeng/chart';
import { Payment } from '../../../../core/models/payment.model';
import { PaymentService } from '../../../../core/services/payment.service';
import { ChangeDetectorRef } from '@angular/core';
import { ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { AdminHeaderService } from '@/app/core/services/adminheader.service';
import { resolveCurrencySymbol } from '@/app/core/utils/tenant-localization';
@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, TableModule, CardModule, SelectModule, FormsModule, ProgressSpinnerModule, TagModule, ChartModule],
  templateUrl: './reports-dashboard.html',
  styleUrl: './reports-dashboard.scss'
})
export class ReportsDashboard implements OnInit {
  payments: Payment[] = [];
  loading = false;
filteredPayments: Payment[] = [];
totalRecords = 0;
pageNumber = 1;
pageSize = 10;

selectedPaymentStatus = 'All';
startDate = '';
endDate = '';

paymentStatusOptions = [
  { label: 'All', value: 'All' },
  { label: 'Paid', value: 'Paid' },
  { label: 'Pending', value: 'Pending' }
];
  totalRevenue = 0;
  totalPaidPayments = 0;
  cashRevenue = 0;
  cardRevenue = 0;
  qrRevenue = 0;
  revenueTrendChartData: any;
  revenueTrendChartOptions: any;
  revenueSplitChartData: any;
  revenueSplitChartOptions: any;
  selectedPaymentMethod = 'All';
  currencySymbol = '\u20B9';

paymentMethodOptions = [
  { label: 'All', value: 'All' },
  { label: 'Cash', value: 'Cash' },
  { label: 'Card', value: 'Card' },
  { label: 'QR Payment', value: 'QR Payment' }
];



  constructor(
    private paymentService: PaymentService,
    private rdf:ChangeDetectorRef,
    private adminHeaderService: AdminHeaderService
  ) {}

  ngOnInit(): void {
    this.loadRestaurantLocalization();
    this.loadReports();
  }
loadRestaurantLocalization(): void {
  this.adminHeaderService.getRestaurant().subscribe({
    next: (restaurant) => {
      this.currencySymbol = resolveCurrencySymbol(restaurant?.currencySymbol, restaurant?.country, restaurant?.currencyCode);
      this.rdf.markForCheck();
    },
    error: (error) => {
      console.error('Failed to load reports localization', error);
    }
  });
}
loadReports(): void {
  this.loading = true;

  this.paymentService.getPagedPayments({
    paymentMethod: this.selectedPaymentMethod,
    paymentStatus: this.selectedPaymentStatus,
    startDate: this.startDate || undefined,
    endDate: this.endDate || undefined,
    pageNumber: this.pageNumber,
    pageSize: this.pageSize
  }).subscribe({
    next: (result) => {
      this.filteredPayments = result.items;
      this.totalRecords = result.totalRecords;
      this.loading = false;
      this.rdf.markForCheck();
    },
    error: (error) => {
      console.error('Failed to load payments', error);
      this.loading = false;
      alert('Failed to load payment reports.');
    }
  });

  this.paymentService.getPayments().subscribe({
    next: (payments) => {
      this.payments = payments;
      this.calculateSummary();
      this.initCharts();
    }
  });
}
onPageChange(event: any): void {
  this.pageNumber = event.page + 1;
  this.pageSize = event.rows;
  this.loadReports();
}


applyFilters(): void {
  this.pageNumber = 1;
  this.loadReports();
  if (this.selectedPaymentMethod === 'All') {
    this.filteredPayments = [...this.payments];
  } else {
    this.filteredPayments = this.payments.filter(
      (p) => p.paymentMethod === this.selectedPaymentMethod
    );
  }
}
@ViewChild('paymentsTable') paymentsTable!: Table;

exportCsv(): void {
  this.paymentsTable.exportCSV();
}
  calculateSummary(): void {
    const paidPayments = this.payments.filter((p) => p.paymentStatus === 'Paid');

    this.totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    this.totalPaidPayments = paidPayments.length;
    this.cashRevenue = paidPayments
      .filter((p) => p.paymentMethod === 'Cash')
      .reduce((sum, p) => sum + p.amount, 0);
    this.cardRevenue = paidPayments
      .filter((p) => p.paymentMethod === 'Card')
      .reduce((sum, p) => sum + p.amount, 0);
    this.qrRevenue = paidPayments
      .filter((p) => p.paymentMethod === 'QR Payment')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  initCharts(): void {
    const paidPayments = this.payments.filter((payment) => payment.paymentStatus === 'Paid');
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#0f172a';
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#64748b';
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#dbe2ea';

    const revenueByDay = paidPayments.reduce<Record<string, number>>((acc, payment) => {
      const day = new Date(payment.paidAt || payment.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      acc[day] = (acc[day] || 0) + payment.amount;
      return acc;
    }, {});

    const trendEntries = Object.entries(revenueByDay).slice(-7);

    this.revenueTrendChartData = {
      labels: trendEntries.map(([day]) => day),
      datasets: [
        {
          label: 'Revenue',
          data: trendEntries.map(([, amount]) => amount),
          fill: true,
          tension: 0.35,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.14)'
        }
      ]
    };

    this.revenueTrendChartOptions = {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        }
      },
      scales: {
        x: {
          ticks: { color: textColorSecondary },
          grid: { color: surfaceBorder, drawBorder: false }
        },
        y: {
          beginAtZero: true,
          ticks: { color: textColorSecondary },
          grid: { color: surfaceBorder, drawBorder: false }
        }
      }
    };

    this.revenueSplitChartData = {
      labels: ['Cash', 'Card', 'QR Payment'],
      datasets: [
        {
          data: [this.cashRevenue, this.cardRevenue, this.qrRevenue],
          backgroundColor: ['#2563eb', '#14b8a6', '#f59e0b'],
          hoverBackgroundColor: ['#1d4ed8', '#0f766e', '#d97706']
        }
      ]
    };

    this.revenueSplitChartOptions = {
      maintainAspectRatio: false,
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

  getSeverity(status: string) {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Pending':
        return 'warn';
      default:
        return 'secondary';
    }
  }
}
