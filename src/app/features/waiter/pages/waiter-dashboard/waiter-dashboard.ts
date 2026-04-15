import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { Button, ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Router } from '@angular/router';
import { Order } from '@/app/core/models/order.model';
import { TablesService } from '@/app/core/services/tables.service';
import { RestaurantTable } from '@/app/core/models/table.model';
import { OrdersService } from '@/app/core/services/orders.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
    selector: 'app-waiter-dashboard',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, TagModule],
    templateUrl: './waiter-dashboard.html',
    styleUrl: './waiter-dashboard.scss'
})
export class WaiterDashboard implements OnInit {
    readyOrders: Order[] = [];
    servedOrderCount = 0;
    occupiedTableCount = 0;
    readyOrderCount = 0;

    constructor(
        private orderService: OrdersService,
        private tableService: TablesService,
        private router: Router,
        private rdf: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadWaiterData();
    }
    goToOrder() {
        this.router.navigate(['/orders']);
    }
    loadWaiterData(): void {
        this.orderService.getAllOrders().subscribe({
            next: (allOrders) => {
                this.readyOrders = allOrders.filter((x) => x.status === 'Ready').sort((a, b) => a.id - b.id);
                this.readyOrderCount = this.readyOrders.length;
                this.servedOrderCount = allOrders.filter((x) => x.status === 'Served').sort((a, b) => a.id - b.id).length;
                this.rdf.detectChanges();
            },
            error: (error) => {
                console.error('Failed to load orders for waiter', error);
            }
        });
        this.tableService.getAllTables().subscribe({
            next: (allTables) => {
                this.occupiedTableCount = allTables.filter((table) => table.status === 'Occupied').length;
                this.rdf.detectChanges();
            },
            error: (error) => {
                console.error('Failed to load tables for waiter', error);
            }
        });
    }
    markServed(order: Order): void {
        this.orderService.updateStatus(order, 'Served').subscribe({
            next: () => this.loadWaiterData(),
            error: (error) => {
                console.error('Failed to mark order served', error);
                alert('Failed to mark order served.');
            }
        });
    }
    markReady(order: Order): void {
        this.orderService.updateStatus(order, 'Ready').subscribe({
            next: () => this.loadWaiterData(),
            error: (error) => {
                console.error('Failed to mark order served', error);
                alert('Failed to mark order served.');
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
