import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';

import { Order } from '../../../../core/models/order.model';
import { Payment } from '../../../../core/models/payment.model';
import { OrdersService } from '../../../../core/services/orders.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { TablesService } from '../../../../core/services/tables.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-billing-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    TagModule
  ],
  templateUrl: './billing-list.html',
  styleUrl: './billing-list.scss'
})
export class BillingList implements OnInit {
  servedOrders: Order[] = [];
  payments: Payment[] = [];
  loading = false;

  paymentDialogVisible = false;
  currentOrder: Order | null = null;

  paymentMethodOptions = [
    { label: 'Cash', value: 'Cash' },
    { label: 'Card', value: 'Card' },
    { label: 'QR Payment', value: 'QR Payment' }
  ];

  selectedPaymentMethod = 'Cash';

  constructor(
    private ordersService: OrdersService,
    private paymentService: PaymentService,
    private refd:ChangeDetectorRef,
    private tablesService: TablesService
  ) {}

  ngOnInit(): void {
    this.loadBillingData();

  }

  loadBillingData(): void {
    this.loading = true;
    this.ordersService.getAllOrders().subscribe({
      next: (orders) => {
        this.paymentService.getPayments().subscribe({
          next: (payments) => {
            this.payments = payments;
            this.refd.detectChanges()
            
            this.servedOrders = orders.filter((order) => {
              const existingPayment = payments.find((p) => p.orderId === order.id);

              this.loading = false;
              return order.status === 'Served' && !existingPayment;
            });
              this.loading = false;

            this.refd.detectChanges()

          
          },
          error: (error) => {
            console.error('Failed to load payments', error);
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error('Failed to load orders', error);
        this.loading = false;
      }
    });
  }

  openPaymentDialog(order: Order): void {
    this.currentOrder = order;
    this.selectedPaymentMethod = 'Cash';
    this.paymentDialogVisible = true;
  }

  markPaid(): void {
    if (!this.currentOrder) return;

    const payment: Payment = {
      id: 0,
      orderId: this.currentOrder.id,
      table: this.currentOrder.table,
      amount: this.currentOrder.total,
      paymentMethod: this.selectedPaymentMethod,
      paymentStatus: 'Paid',
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString()
    };
console.log('Payment payload:', payment);
    this.paymentService.addPayment(payment).subscribe({
      next: () => {
        this.tablesService.getTableByNumber(this.currentOrder!.table).subscribe({
          next: (table) => {
            if (!table) {
              alert('Payment saved, but table not found.');
              this.paymentDialogVisible = false;
              this.loadBillingData();
              return;
            }

            this.tablesService.updateTable({
              ...table,
              status: 'Available'
            }).subscribe({
              next: () => {
                this.paymentDialogVisible = false;
                this.currentOrder = null;
                this.loadBillingData();
              },
              error: (error) => {
                console.error('Failed to release table', error);
                alert('Payment saved, but failed to release table.');
              }
            });
          },
          error: (error) => {
            console.error('Failed to find table', error);
            alert('Payment saved, but failed to load table.');
          }
        });
      },
      error: (error) => {
        console.error('Failed to save payment', error);
        alert('Failed to save payment.');
      }
    });
  }

  getSeverity(status: string) {
    switch (status) {
      case 'Served':
        return 'info';
      case 'Paid':
        return 'success';
      case 'Pending':
        return 'warn';
      default:
        return 'secondary';
    }
  }
}