import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Router, RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';

import { CartItem } from '@/app/core/models/cart-item.model';
import { CartService } from '@/app/core/services/cart.service';
import { PublicOrderingService } from '@/app/core/services/public-ordering.service';
import { PublicRestaurantSettings } from '@/app/core/models/public-restaurant-settings.model';
import { resolveCurrencySymbol } from '@/app/core/utils/tenant-localization';

@Component({
    selector: 'app-cart-page',
    imports: [CommonModule, FormsModule, TagModule, ButtonModule, CardModule, TableModule, RouterModule],
    standalone: true,
    templateUrl: './cart-page.html',
    styleUrl: './cart-page.scss'
})
export class CartPage implements OnInit {
    cartItems: CartItem[] = [];
    total = 0;
    tableNumber = '';
    restaurantId: number | null = null;
    restaurantName = '';
    orderType: 'DineIn' | 'Takeaway' = 'DineIn';
    restaurantSettings?: PublicRestaurantSettings;
    constructor(
        private cartService: CartService,
        private router: Router,
        private publicOrderingService: PublicOrderingService
    ) {}

    ngOnInit(): void {
        this.loadCartItems();
        if (this.tableNumber || this.restaurantId) {
            this.loadRestaurantSettings();
        }
    }
    loadCartItems(): void {
        this.cartItems = this.cartService.getCartItems();
        this.total = this.cartService.getCartTotal();
        this.tableNumber = this.cartService.getTableNumber();
        this.restaurantId = this.cartService.getRestaurantId();
        this.restaurantName = this.cartService.getRestaurantName();
        this.orderType = this.cartService.getOrderType();
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
                console.error('Failed to load cart restaurant settings', error);
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
    increaseQuantity(menuItemId: number): void {
        this.cartService.increaseQuantity(menuItemId);
        this.loadCartItems();
    }
    decreaseQuantity(menuItemId: number): void {
        this.cartService.decreaseQuantity(menuItemId);
        this.loadCartItems();
    }
    removeItem(menuItemId: number): void {
        this.cartService.removeFromCart(menuItemId);
        this.loadCartItems();
    }
    updateSpecialInstructions(menuItemId: number, instructions: string): void {
        this.cartService.updateSpecialInstructions(menuItemId, instructions);
        this.loadCartItems();
    }
    clearCart(): void {
        const confirm = window.confirm('Are you sure you want to clar the cart');
        if (!confirm) {
            return;
        }
        this.cartService.clearCart();
        this.loadCartItems();
    }
    goBackToMenu(): void {
      if (this.tableNumber) {
        this.router.navigate(['/qr-menu', this.tableNumber || 'T1']);
        return;
      }

      if (this.restaurantId) {
        this.router.navigate(['/restaurants', this.restaurantId]);
        return;
      }

      this.router.navigate(['/restaurants']);
    }
    goToCheckOut(): void {
        this.router.navigate(['/checkout']);
    }
}
