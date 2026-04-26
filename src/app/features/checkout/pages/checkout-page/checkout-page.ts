import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';

import { CartItem } from '@/app/core/models/cart-item.model';
import { CartService } from '@/app/core/services/cart.service';
import { Order } from '@/app/core/models/order.model';
import { PaymentOption } from '@/app/core/models/payment-option.model';
import { OrderItem } from '@/app/core/models/order-item.model';
import { NotificationService } from '@/app/core/services/notification.service';
import { finalize } from 'rxjs';
import { PublicOrderingService } from '@/app/core/services/public-ordering.service';
import { PublicRestaurantSettings } from '@/app/core/models/public-restaurant-settings.model';
import { resolveCurrencySymbol, resolveTaxName, resolveTaxRate } from '@/app/core/utils/tenant-localization';

@Component({
    selector: 'app-checkout-page',
    imports: [CommonModule, RouterModule, FormsModule, TableModule, ButtonModule, CardModule, SelectModule],
    templateUrl: './checkout-page.html',
    styleUrl: './checkout-page.scss'
})
export class CheckoutPage implements OnInit {
    cartItems: CartItem[] = [];
    total = 0;
    tableNumber = '';
    restaurantId: number | null = null;
    restaurantName = '';
    orderType: 'DineIn' | 'Takeaway' = 'DineIn';
    selectedPaymentMode = 'Cash';
    loading=false;
    restaurantSettings?: PublicRestaurantSettings;
    paymentOption: PaymentOption[] = [
        { label: 'Pay at Counter', value: 'Pay at Counter' },
        { label: 'Cash', value: 'Cash' },
        { label: 'Card', value: 'Card' },
        { label: 'QR Payment', value: 'QR Payment' }
    ];
    constructor(
        private cartService: CartService,
        private router: Router,
        private notificationService: NotificationService,
        private publicOrderingService: PublicOrderingService
    ) {}

    ngOnInit(): void {
        this.loadCheckOutData();
        if (this.tableNumber || this.restaurantId) {
            this.loadRestaurantSettings();
        }
    }
    loadCheckOutData(): void {
        this.cartItems = this.cartService.getCartItems();
        this.total = this.cartService.getCartTotal();
        this.tableNumber = this.cartService.getTableNumber();
        this.restaurantId = this.cartService.getRestaurantId();
        this.restaurantName = this.cartService.getRestaurantName();
        this.orderType = this.cartService.getOrderType();
        this.selectedPaymentMode = this.tableNumber ? 'Pay at Counter' : this.selectedPaymentMode;
    }

    get isPayAtCounterSelected(): boolean {
        return this.selectedPaymentMode === 'Pay at Counter';
    }

    get visiblePaymentOptions(): PaymentOption[] {
        return this.isPayAtCounterSelected
            ? this.paymentOption.filter((option) => option.value === 'Pay at Counter')
            : this.paymentOption;
    }

    get selectedPaymentOption(): PaymentOption | undefined {
        return this.paymentOption.find((option) => option.value === this.selectedPaymentMode);
    }

    selectPaymentMode(mode: string): void {
        this.selectedPaymentMode = mode;
    }

    changePaymentMode(): void {
        this.selectedPaymentMode = 'Cash';
    }

    getPaymentDescription(option: PaymentOption): string {
        switch (option.value) {
            case 'Pay at Counter':
                return this.tableNumber
                    ? `Place the table order now and pay at the counter after service.`
                    : `Place the order now and settle at the counter.`;
            case 'Cash':
                return `Pay directly at ${this.orderType === 'Takeaway' ? 'pickup' : 'the restaurant'}.`;
            case 'Card':
                return 'Confirm quickly with card payment.';
            case 'QR Payment':
                return 'Scan and complete with QR.';
            default:
                return 'Choose this payment method for the order.';
        }
    }

    getCartItemInstructions(cartItem: CartItem): string {
        return cartItem.specialInstructions?.trim() || '';
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
            },
            error: (error) => {
                console.error('Failed to load checkout restaurant settings', error);
            }
        });
    }

    get currencySymbol(): string {
        return resolveCurrencySymbol(
            this.restaurantSettings?.currencySymbol,
            this.restaurantSettings?.country,
            this.restaurantSettings?.currencyCode
        );
    }

    get taxName(): string {
        return resolveTaxName(this.restaurantSettings?.taxName, this.restaurantSettings?.country);
    }

    get taxRate(): number {
        return resolveTaxRate(this.restaurantSettings?.taxRate, this.restaurantSettings?.country);
    }

    get taxAmount(): number {
        return this.total * this.taxRate;
    }

    get grandTotal(): number {
        return this.total + this.taxAmount;
    }

    private async navigateToOrderSuccess(orderId: number): Promise<void> {
        const queryParams = {
            orderId,
            table: this.tableNumber,
            restaurantId: this.restaurantId,
            restaurantName: this.restaurantSettings?.restaurantName || this.restaurantName,
            orderType: this.orderType,
            payment: this.selectedPaymentMode,
            total: this.grandTotal
        };

        const navigated = await this.router.navigate(['/order-success'], { queryParams });

        if (!navigated) {
            const fallbackUrl = this.router.createUrlTree(['/order-success'], { queryParams }).toString();
            await this.router.navigateByUrl(fallbackUrl);
        }
    }

    placeOrder(): void {
        if (!this.tableNumber && !this.restaurantId) {
            this.notificationService.warn('Missing restaurant', 'Restaurant details are missing.');
            return;
        }
        if (this.cartItems.length === 0) {
            this.notificationService.warn('Empty cart', 'Your cart is empty.');
            return;
        }
        this.loading=true;
       const structuredItem:OrderItem[]=this.cartItems.map((item,index)=>({
            id:0,
            menuItemId:item.menuItem.id,
            menuItemName:item.menuItem.name,
            quantity:item.quantity,
            unitPrice:item.menuItem.price,
            totalPrice:item.menuItem.price * item.quantity,
            specialInstructions:item.specialInstructions?.trim() || ''
            
       }));
       const itemsText = structuredItem
  .map((item) => `${item.menuItemName} x${item.quantity}${item.specialInstructions ? ` (${item.specialInstructions})` : ''}`)
  .join(', ');

const newOrder: Order = {
  id: 0,
  table: this.tableNumber || (this.orderType === 'Takeaway' ? 'Takeaway' : 'Dine-In'),
  total: this.grandTotal,
  status: 'Preparing',
  createdAt: new Date().toISOString(),
  itemsText:itemsText,
  items: structuredItem
};

        this.publicOrderingService
            .createOrder({
                ...newOrder,
                restaurantId: this.restaurantId,
                orderType: this.orderType,
                paymentMode: this.selectedPaymentMode
            })
            .pipe(
                finalize(() => {
                    this.loading = false;
                })
            )
            .subscribe({
                next: async (createdOrder) => {
                    if (!createdOrder?.id) {
                        this.notificationService.error('Order placed', 'The order was created, but the success page link was missing.');
                        return;
                    }

                    try {
                        await this.navigateToOrderSuccess(createdOrder.id);
                        this.cartService.clearCart();
                        this.notificationService.success(
                            'Order placed',
                            `Your order was placed successfully using ${this.selectedPaymentMode}.`
                        );
                    } catch (navigationError) {
                        console.error('Failed to navigate to order success page', navigationError);
                        this.notificationService.error(
                            'Navigation failed',
                            'Your order was placed, but we could not open the tracking page automatically.'
                        );
                    }
                },
                error: (error) => {
                    console.error('Failed to place order', error);
                    this.notificationService.showApiError(error, 'Failed to place order.');
                }
            });
    }
    goBackToCart(): void {
        this.router.navigate(['/cart']);
    }
}
