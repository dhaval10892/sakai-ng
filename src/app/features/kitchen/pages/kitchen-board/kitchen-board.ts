import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Order } from '@/app/core/models/order.model';
import { OrdersService } from '@/app/core/services/orders.service';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';

@Component({
    selector: 'app-kitchen-board',
    standalone: true,
    imports: [CommonModule, TagModule, CardModule, ButtonModule],
    templateUrl: './kitchen-board.html',
    styleUrl: './kitchen-board.scss'
})
export class KitchenBoard implements OnInit {
    kitchenOrders: Order[] = [];
    loading = false;
    constructor(
        private orderService: OrdersService,
        private router: Router,
        private drf:ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadKitchenOrders();
    }
    goToWaiter() {
        this.router.navigate(['/waiter']);
    }
    loadKitchenOrders(): void {
        this.loading = true;

        this.orderService.getAllOrders().subscribe({
            next: (allOrders) => {
                this.kitchenOrders = allOrders.filter((order) => order.status === 'Preparing' || order.status === 'Ready').sort((a, b) => b.id - a.id);

                this.loading = false;
                this.drf.detectChanges();
                console.log(this.kitchenOrders);
            },
            error: (error) => {
                console.error('Failed to load kitchen orders', error);
                this.loading = false;
            }
        });
    }
    markPreparing(order: Order): void {
        this.orderService.updateStatus(order, 'Preparing').subscribe({
            next: () => this.loadKitchenOrders(),
            error: (error) => {
                console.log('Failed to update status ', error);
                alert('Failed to update status.');
            }
        });
    }
    markReady(order: Order): void {
        this.orderService.updateStatus(order, 'Ready').subscribe({
            next: () => this.loadKitchenOrders(),
            error: (error) => {
                console.log('Failed to update status ', error);
                alert('Failed to update status.');
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
