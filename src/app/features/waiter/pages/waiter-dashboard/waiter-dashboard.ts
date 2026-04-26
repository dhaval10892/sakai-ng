import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { Button, ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Router } from '@angular/router';
import { Order } from '@/app/core/models/order.model';
import { TablesService } from '@/app/core/services/tables.service';
import { OrdersService } from '@/app/core/services/orders.service';
import { ChangeDetectorRef } from '@angular/core';
import { NotificationService } from '@/app/core/services/notification.service';
import { Observable, Subscription, catchError, forkJoin, switchMap, timer } from 'rxjs';

@Component({
    selector: 'app-waiter-dashboard',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, TagModule],
    templateUrl: './waiter-dashboard.html',
    styleUrl: './waiter-dashboard.scss'
})
export class WaiterDashboard implements OnInit, OnDestroy {
    private readonly refreshIntervalMs = 5000;
    readyOrders: Order[] = [];
    servedOrderCount = 0;
    onTheWayOrderCount = 0;
    occupiedTableCount = 0;
    activeWaiterOrderCount = 0;
    private refreshSubscription?: Subscription;

    constructor(
        private orderService: OrdersService,
        private tableService: TablesService,
        private router: Router,
        private rdf: ChangeDetectorRef,
        private notificationService: NotificationService
    ) {}

    ngOnInit(): void {
        this.startAutoRefresh();
    }

    ngOnDestroy(): void {
        this.refreshSubscription?.unsubscribe();
    }
    goToOrder() {
        this.router.navigate(['/orders']);
    }
    startAutoRefresh(): void {
        this.refreshSubscription?.unsubscribe();
        this.refreshSubscription = timer(0, this.refreshIntervalMs)
            .pipe(
                switchMap(() =>
                    forkJoin({
                        allOrders: this.orderService.getAllOrders(),
                        allTables: this.tableService.getAllTables()
                    })
                )
            )
            .subscribe({
                next: ({ allOrders, allTables }) => {
                    const normalizedOrders = allOrders.map((order) => ({
                        ...order,
                        status: this.normalizeStatus(order.status)
                    }));

                    this.readyOrders = normalizedOrders
                        .filter((order) => order.status === 'Ready' || order.status === 'On the Way')
                        .sort((a, b) => a.id - b.id);
                    this.activeWaiterOrderCount = this.readyOrders.length;
                    this.onTheWayOrderCount = normalizedOrders.filter((order) => order.status === 'On the Way').length;
                    this.servedOrderCount = normalizedOrders.filter((order) => order.status === 'Served').length;
                    this.occupiedTableCount = allTables.filter((table) => table.status === 'Occupied').length;
                    this.rdf.markForCheck();
                },
                error: (error) => {
                    console.error('Failed to refresh waiter dashboard', error);
                    this.notificationService.showApiError(error, 'Failed to refresh waiter dashboard.');
                }
            });
    }

    loadWaiterData(): void {
        forkJoin({
            allOrders: this.orderService.getAllOrders(),
            allTables: this.tableService.getAllTables()
        }).subscribe({
            next: ({ allOrders, allTables }) => {
                const normalizedOrders = allOrders.map((order) => ({
                    ...order,
                    status: this.normalizeStatus(order.status)
                }));

                this.readyOrders = normalizedOrders
                    .filter((order) => order.status === 'Ready' || order.status === 'On the Way')
                    .sort((a, b) => a.id - b.id);
                this.activeWaiterOrderCount = this.readyOrders.length;
                this.onTheWayOrderCount = normalizedOrders.filter((order) => order.status === 'On the Way').length;
                this.servedOrderCount = normalizedOrders.filter((order) => order.status === 'Served').length;
                this.occupiedTableCount = allTables.filter((table) => table.status === 'Occupied').length;
                this.rdf.markForCheck();
            },
            error: (error) => {
                console.error('Failed to refresh waiter dashboard', error);
                this.notificationService.showApiError(error, 'Failed to refresh waiter dashboard.');
            }
        });
    }
    markServed(order: Order): void {
        const previousState = this.captureLocalState();
        this.applyLocalOrderStatus(order.id, 'Served');

        this.updateOrderStatus(order, 'Served').subscribe({
            next: () => {
                this.notificationService.success('Order updated', `Order #${order.id} marked as served.`);
            },
            error: (error) => {
                this.restoreLocalState(previousState);
                console.error('Failed to mark order served', error);
                this.notificationService.showApiError(error, 'Failed to mark order as served.');
            }
        });
    }
    markOnTheWay(order: Order): void {
        const previousState = this.captureLocalState();
        this.applyLocalOrderStatus(order.id, 'On the Way');

        this.updateOrderStatus(order, 'On the Way').subscribe({
            next: () => {
                this.notificationService.success('Order updated', `Order #${order.id} is now on the way.`);
            },
            error: (error) => {
                this.restoreLocalState(previousState);
                console.error('Failed to update order to on the way', error);
                this.notificationService.showApiError(error, 'Failed to mark the order as on the way.');
            }
        });
    }
    getSeverity(status: string) {
        switch (this.normalizeStatus(status)) {
            case 'Preparing':
                return 'warn';
            case 'Ready':
                return 'success';
            case 'On the Way':
                return 'info';
            case 'Served':
                return 'contrast';
            default:
                return 'secondary';
        }
    }

    private normalizeStatus(status?: string | null): string {
        const normalizedStatus = (status || '').trim().toLowerCase();

        switch (normalizedStatus) {
            case 'ready':
                return 'Ready';
            case 'on the way':
            case 'ontheway':
            case 'on-the-way':
                return 'On the Way';
            case 'served':
                return 'Served';
            case 'preparing':
            default:
                return 'Preparing';
        }
    }

    private applyLocalOrderStatus(orderId: number, status: string): void {
        const normalizedStatus = this.normalizeStatus(status);
        const updatedOrders = this.readyOrders
            .map((order) => (order.id === orderId ? { ...order, status: normalizedStatus } : order))
            .filter((order) => order.status === 'Ready' || order.status === 'On the Way')
            .sort((left, right) => left.id - right.id);

        this.readyOrders = updatedOrders;
        this.activeWaiterOrderCount = updatedOrders.length;
        this.onTheWayOrderCount = updatedOrders.filter((order) => order.status === 'On the Way').length;
        this.servedOrderCount += normalizedStatus === 'Served' ? 1 : 0;
        this.rdf.markForCheck();
    }

    private captureLocalState(): { readyOrders: Order[]; servedOrderCount: number; onTheWayOrderCount: number; activeWaiterOrderCount: number } {
        return {
            readyOrders: this.readyOrders.map((order) => ({ ...order })),
            servedOrderCount: this.servedOrderCount,
            onTheWayOrderCount: this.onTheWayOrderCount,
            activeWaiterOrderCount: this.activeWaiterOrderCount
        };
    }

    private restoreLocalState(state: { readyOrders: Order[]; servedOrderCount: number; onTheWayOrderCount: number; activeWaiterOrderCount: number }): void {
        this.readyOrders = state.readyOrders;
        this.servedOrderCount = state.servedOrderCount;
        this.onTheWayOrderCount = state.onTheWayOrderCount;
        this.activeWaiterOrderCount = state.activeWaiterOrderCount;
        this.rdf.markForCheck();
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
