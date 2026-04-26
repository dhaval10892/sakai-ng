import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Order } from '@/app/core/models/order.model';
import { OrdersService } from '@/app/core/services/orders.service';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { NotificationService } from '@/app/core/services/notification.service';
import { Observable, Subscription, catchError, switchMap, timer } from 'rxjs';

@Component({
    selector: 'app-kitchen-board',
    standalone: true,
    imports: [CommonModule, TagModule, CardModule, ButtonModule],
    templateUrl: './kitchen-board.html',
    styleUrl: './kitchen-board.scss'
})
export class KitchenBoard implements OnInit, OnDestroy {
    private readonly refreshIntervalMs = 5000;
    kitchenOrders: Order[] = [];
    loading = false;
    private refreshSubscription?: Subscription;
    private knownTakeawayIds = new Set<number>();
    private hasLoadedOrders = false;

    constructor(
        private orderService: OrdersService,
        private router: Router,
        private drf:ChangeDetectorRef,
        private notificationService: NotificationService
    ) {}

    ngOnInit(): void {
        this.startAutoRefresh();
    }

    ngOnDestroy(): void {
        this.refreshSubscription?.unsubscribe();
    }
    goToWaiter() {
        this.router.navigate(['/waiter']);
    }
    startAutoRefresh(): void {
        this.refreshSubscription?.unsubscribe();
        this.loading = true;

        this.refreshSubscription = timer(0, this.refreshIntervalMs)
            .pipe(
                switchMap(() => this.orderService.getAllOrders())
            )
            .subscribe({
                next: (allOrders) => {
                    this.kitchenOrders = allOrders
                        .map((order) => ({
                            ...order,
                            status: this.normalizeStatus(order.status)
                        }))
                        .filter((order) => order.status === 'Preparing')
                        .sort((a, b) => b.id - a.id);

                    this.notifyNewTakeawayOrders(this.kitchenOrders);
                    this.loading = false;
                    this.drf.markForCheck();
                },
                error: (error) => {
                    console.error('Failed to load kitchen orders', error);
                    this.loading = false;
                    this.notificationService.showApiError(error, 'Failed to load kitchen orders.');
                }
            });
    }

    loadKitchenOrders(): void {
        this.loading = true;
        this.orderService.getAllOrders().subscribe({
            next: (allOrders) => {
                this.kitchenOrders = allOrders
                    .map((order) => ({
                        ...order,
                        status: this.normalizeStatus(order.status)
                    }))
                    .filter((order) => order.status === 'Preparing')
                    .sort((a, b) => b.id - a.id);

                this.notifyNewTakeawayOrders(this.kitchenOrders);
                this.loading = false;
                this.drf.markForCheck();
            },
            error: (error) => {
                console.error('Failed to load kitchen orders', error);
                this.loading = false;
                this.notificationService.showApiError(error, 'Failed to load kitchen orders.');
            }
        });
    }
    markPreparing(order: Order): void {
        const previousStatus = order.status;
        this.applyLocalStatus(order.id, 'Preparing');

        this.updateOrderStatus(order, 'Preparing').subscribe({
            next: () => {
                this.notificationService.success('Order updated', `Order #${order.id} is now preparing.`);
            },
            error: (error) => {
                this.applyLocalStatus(order.id, previousStatus);
                console.log('Failed to update status ', error);
                this.notificationService.showApiError(error, 'Failed to update order status.');
            }
        });
    }
    markReady(order: Order): void {
        const previousStatus = order.status;
        this.applyLocalStatus(order.id, 'Ready');

        this.updateOrderStatus(order, 'Ready').subscribe({
            next: () => {
                this.notificationService.success('Order updated', `Order #${order.id} is ready to serve.`);
            },
            error: (error) => {
                this.applyLocalStatus(order.id, previousStatus);
                console.log('Failed to update status ', error);
                this.notificationService.showApiError(error, 'Failed to update order status.');
            }
        });
    }

    getSeverity(status: string) {
        switch (this.normalizeStatus(status)) {
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

    isTakeaway(order: Order): boolean {
        return (order.table || '').trim().toLowerCase() === 'takeaway';
    }

    private notifyNewTakeawayOrders(orders: Order[]): void {
        const takeawayOrders = orders.filter((order) => this.isTakeaway(order));
        const latestTakeawayIds = new Set(takeawayOrders.map((order) => order.id));

        if (this.hasLoadedOrders) {
            takeawayOrders
                .filter((order) => !this.knownTakeawayIds.has(order.id))
                .forEach((order) => {
                    this.notificationService.warn('Takeaway order ready to pack', `Order #${order.id} needs kitchen packing.`);
                });
        }

        this.knownTakeawayIds = latestTakeawayIds;
        this.hasLoadedOrders = true;
    }

    private normalizeStatus(status?: string | null): string {
        const normalizedStatus = (status || '').trim().toLowerCase();

        switch (normalizedStatus) {
            case 'ready':
                return 'Ready';
            case 'served':
                return 'Served';
            case 'on the way':
            case 'ontheway':
            case 'on-the-way':
                return 'On the Way';
            case 'preparing':
            default:
                return 'Preparing';
        }
    }

    private applyLocalStatus(orderId: number, status: string): void {
        this.kitchenOrders = this.kitchenOrders
            .map((order) => (order.id === orderId ? { ...order, status: this.normalizeStatus(status) } : order))
            .filter((order) => order.status === 'Preparing')
            .sort((left, right) => right.id - left.id);
        this.drf.markForCheck();
    }

    private updateOrderStatus(order: Order, status: string): Observable<void> {
        return this.orderService.updateStatusFast(order.id, status).pipe(
            catchError((error) => {
                console.warn('Fast order status update failed; retrying with full order update.', error);
                return this.orderService.updateStatus(order, status);
            })
        );
    }
}
