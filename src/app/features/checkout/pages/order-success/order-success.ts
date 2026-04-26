import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { OrdersService } from '@/app/core/services/orders.service';
import { Order } from '@/app/core/models/order.model';
import { Subscription, interval, startWith, switchMap } from 'rxjs';
import { PublicOrderingService } from '@/app/core/services/public-ordering.service';
import { PublicRestaurantSettings } from '@/app/core/models/public-restaurant-settings.model';
import { resolveCurrencySymbol, resolveTaxName, resolveTaxRate } from '@/app/core/utils/tenant-localization';

@Component({
  selector: 'app-order-success',
  standalone:true,
  imports: [CommonModule,RouterModule,ButtonModule,CardModule,MessageModule],
  templateUrl: './order-success.html',
  styleUrl: './order-success.scss',
})
export class OrderSuccess implements OnInit, OnDestroy{
tableNumber='';
restaurantId: number | null = null;
restaurantName = '';
orderType: 'DineIn' | 'Takeaway' = 'DineIn';
paymentMode='';
orderId: number | null = null;
currentStatus = 'Preparing';
trackingSubscription?: Subscription;
lastUpdatedAt: Date | null = null;
restaurantSettings?: PublicRestaurantSettings;

private readonly orderFlowSteps = [
  {
    status: 'Preparing',
    icon: 'pi pi-spin pi-cog',
    title: 'Preparing',
    description: 'The kitchen has started preparing your order.'
  },
  {
    status: 'Ready',
    icon: 'pi pi-check-circle',
    title: 'Ready',
    description: 'Your order is ready and waiting for the waiter.'
  },
  {
    status: 'On the Way',
    icon: 'pi pi-truck',
    title: 'On the way',
    description: 'Your waiter is bringing the order to your table.'
  },
  {
    status: 'Served',
    icon: 'pi pi-star-fill',
    title: 'Served',
    description: 'Your order has arrived at the table.'
  }
];

constructor(
private router:Router,
private activatedRoute:ActivatedRoute,
private ordersService: OrdersService,
private cdr: ChangeDetectorRef,
private publicOrderingService: PublicOrderingService
){}


ngOnInit(): void {
  const orderIdParam = this.activatedRoute.snapshot.queryParamMap.get('orderId');
  const parsedOrderId = orderIdParam ? Number(orderIdParam) : null;
  this.orderId = parsedOrderId && Number.isFinite(parsedOrderId) ? parsedOrderId : null;
  this.tableNumber=this.activatedRoute.snapshot.queryParamMap.get('table')||'';
  const restaurantIdParam = this.activatedRoute.snapshot.queryParamMap.get('restaurantId');
  const parsedRestaurantId = restaurantIdParam ? Number(restaurantIdParam) : null;
  this.restaurantId = parsedRestaurantId && Number.isFinite(parsedRestaurantId) ? parsedRestaurantId : null;
  this.restaurantName=this.activatedRoute.snapshot.queryParamMap.get('restaurantName')||'';
  this.orderType=(this.activatedRoute.snapshot.queryParamMap.get('orderType') as 'DineIn' | 'Takeaway') || 'DineIn';
  this.paymentMode=this.activatedRoute.snapshot.queryParamMap.get('payment')||'';

  if (this.tableNumber || this.restaurantId) {
    this.loadRestaurantSettings();
  }

  if (this.orderId) {
    this.startTracking();
  }
}

ngOnDestroy(): void {
  this.trackingSubscription?.unsubscribe();
}

loadRestaurantSettings(): void {
  const request$ = this.tableNumber
    ? this.publicOrderingService.getRestaurantSettings(this.tableNumber)
    : this.restaurantId
      ? this.publicOrderingService.getRestaurantSettingsByRestaurant(this.restaurantId)
      : null;

  if (!request$) {
    return;
  }

  request$.subscribe({
    next: (settings) => {
      this.restaurantSettings = settings;
      this.cdr.markForCheck();
    },
    error: (error) => {
      console.error('Failed to load restaurant settings', error);
      this.cdr.markForCheck();
    }
  });
}

startTracking(): void {
  this.trackingSubscription = interval(5000)
    .pipe(
      startWith(0),
      switchMap(() => this.ordersService.getOrderById(this.orderId!))
    )
    .subscribe({
      next: (order: Order) => {
        this.currentStatus = this.normalizeStatus(order.status);
        this.lastUpdatedAt = new Date();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to track order status', error);
        this.cdr.markForCheck();
      }
    });
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

get trackingSteps() {
  const currentIndex = this.currentStepIndex;

  return this.orderFlowSteps.map((step, index) => ({
    ...step,
    stepNumber: index + 1,
    isCurrent: step.status === this.currentStatus,
    isCompleted: currentIndex >= 0 && index < currentIndex,
    isUpcoming: currentIndex >= 0 && index > currentIndex
  }));
}

get currentStep() {
  return this.trackingSteps[this.currentStepIndex];
}

get currentStepIndex(): number {
  const currentIndex = this.orderFlowSteps.findIndex((step) => step.status === this.currentStatus);
  return currentIndex >= 0 ? currentIndex : 0;
}

get trackingProgress(): number {
  if (this.orderFlowSteps.length <= 1) {
    return 100;
  }

  return (this.currentStepIndex / (this.orderFlowSteps.length - 1)) * 100;
}

get trackingProgressLabel(): string {
  return `${Math.round(this.trackingProgress)}% complete`;
}

get currencySymbol(): string {
  return resolveCurrencySymbol(
    this.restaurantSettings?.currencySymbol,
    this.restaurantSettings?.country,
    this.restaurantSettings?.currencyCode
  );
}

get taxRate(): number {
  return resolveTaxRate(this.restaurantSettings?.taxRate, this.restaurantSettings?.country);
}

get taxName(): string {
  return resolveTaxName(this.restaurantSettings?.taxName, this.restaurantSettings?.country);
}

get orderSubtotal(): number {
  const divisor = 1 + this.taxRate;
  if (divisor <= 0) {
    return this.orderTotal;
  }

  return this.orderTotal / divisor;
}

get orderTaxAmount(): number {
  return this.orderTotal - this.orderSubtotal;
}

get orderTotal(): number {
  const totalParam = this.activatedRoute.snapshot.queryParamMap.get('total');
  const total = totalParam ? Number(totalParam) : 0;
  return Number.isFinite(total) ? total : 0;
}

get currentStepTitle(): string {
  return this.orderFlowSteps[this.currentStepIndex]?.title ?? 'Preparing';
}

get nextStepTitle(): string {
  return this.orderFlowSteps[this.currentStepIndex + 1]?.title ?? 'Delivered to table';
}

get nextStepDescription(): string {
  return this.orderFlowSteps[this.currentStepIndex + 1]?.description ?? 'Your order journey is complete.';
}

get liveStatusTone(): string {
  switch (this.currentStatus) {
    case 'Served':
      return 'served';
    case 'On the Way':
      return 'transit';
    case 'Ready':
      return 'ready';
    default:
      return 'preparing';
  }
}

get lastUpdatedLabel(): string {
  return this.lastUpdatedAt
    ? this.lastUpdatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Waiting for first update';
}

get customerStatusTitle(): string {
  switch (this.currentStatus) {
    case 'Ready':
      return 'Order ready';
    case 'On the Way':
      return 'Order on the way';
    case 'Served':
      return 'Order served';
    default:
      return 'Order preparing';
  }
}

get customerStatusDescription(): string {
  switch (this.currentStatus) {
    case 'Ready':
      return 'The kitchen has finished your order and the waiter will pick it up shortly.';
    case 'On the Way':
      return 'Your waiter is bringing the order to your table right now.';
    case 'Served':
      return 'Your food has reached the table. Enjoy your meal.';
    default:
      return 'The kitchen team is currently preparing your dishes.';
  }
}

backToMenu():void{
  this.addMoreItems();
}

addMoreItems(): void {
  if (this.tableNumber) {
    this.router.navigate(['/qr-menu', this.tableNumber]);
    return;
  }

  if (this.restaurantId) {
    this.router.navigate(['/restaurants', this.restaurantId]);
    return;
  }

  this.router.navigate(['/restaurants']);
}

printBill(): void {
  window.print();
}

goToKitchen():void{
  this.router.navigate(['/kitchen']);
}

}
