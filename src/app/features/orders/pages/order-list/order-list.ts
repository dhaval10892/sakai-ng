import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ChangeDetectorRef } from '@angular/core';
import { Order } from '../../../../core/models/order.model';
import { OrdersService } from '../../../../core/services/orders.service';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TagModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule
  ],
  templateUrl: './order-list.html',
  styleUrl: './order-list.scss'
})
export class OrderList implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];

  editDialogVisible = false;
  detailsDialogVisible = false;

  selectedStatusFilter = 'All';
  loading = false;

  statusOptions = [
    { label: 'Preparing', value: 'Preparing' },
    { label: 'Ready', value: 'Ready' },
    { label: 'Served', value: 'Served' }
  ];

  filterOptions = [
    { label: 'All', value: 'All' },
    { label: 'Preparing', value: 'Preparing' },
    { label: 'Ready', value: 'Ready' },
    { label: 'Served', value: 'Served' }
  ];

  currentOrder: Order = this.getEmptyOrder();

  constructor(private ordersService: OrdersService,private rdf:ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;

    this.ordersService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.applyFilter();
        this.loading = false;
        this.rdf.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load orders', error);
        this.loading = false;
        alert('Failed to load orders from API.');
      }
    });
  }

  applyFilter(): void {
    if (this.selectedStatusFilter === 'All') {
      this.filteredOrders = [...this.orders];
    } else {
      this.filteredOrders = this.orders.filter(
        (x) => x.status === this.selectedStatusFilter
      );
    }
  }

  onFilterChange(): void {
    this.applyFilter();
  }

  getEmptyOrder(): Order {
    return {
      id: 0,
      table: '',
      total: 0,
      status: 'Preparing',
      createdAt: new Date().toISOString(),
      itemsText: '',
      items: []
    };
  }

  openDetailsDialog(order: Order): void {
    this.currentOrder = { ...order };
    this.detailsDialogVisible = true;
  }

  openEditDialog(order: Order): void {
    this.currentOrder = {
      ...order,
      items: [...order.items]
    };
    this.editDialogVisible = true;
  }

  saveOrder(): void {
    this.currentOrder.table = this.currentOrder.table.trim().toUpperCase();

    if (!this.currentOrder.table) {
      alert('Table is required.');
      return;
    }

    this.ordersService.updateOrder(this.currentOrder).subscribe({
      next: () => {
        this.loadOrders();
        this.editDialogVisible = false;
        this.currentOrder = this.getEmptyOrder();
      },
      error: (error) => {
        console.error('Failed to update order', error);
        alert('Failed to update order.');
      }
    });
  }

  deleteOrder(id: number): void {
    const confirmed = window.confirm('Are you sure you want to delete this order?');
    if (!confirmed) return;

    this.ordersService.deleteOrder(id).subscribe({
      next: () => {
        this.loadOrders();
      },
      error: (error) => {
        console.error('Failed to delete order', error);
        alert('Failed to delete order.');
      }
    });
  }

  getSeverity(status: string) {
    switch (status) {
      case 'Preparing':
        return 'warn';
      case 'Ready':
        return 'success';
      case 'Served':
        return 'info';
      default:
        return 'secondary';
    }
  }
}