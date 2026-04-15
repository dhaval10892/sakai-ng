import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Payment } from '../../../../core/models/payment.model';
import { PaymentService } from '../../../../core/services/payment.service';
import { ChangeDetectorRef } from '@angular/core';
import { ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { SelectModule } from 'primeng/select';
@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, TableModule, CardModule,SelectModule,FormsModule, ProgressSpinnerModule,TagModule],
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
  selectedPaymentMethod = 'All';

paymentMethodOptions = [
  { label: 'All', value: 'All' },
  { label: 'Cash', value: 'Cash' },
  { label: 'Card', value: 'Card' },
  { label: 'QR Payment', value: 'QR Payment' }
];



  constructor(private paymentService: PaymentService,private rdf:ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadReports();
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
      this.rdf.detectChanges();
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