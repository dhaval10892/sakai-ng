import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Router, RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';

import { CartItem } from '@/app/core/models/cart-item.model';
import { CartService } from '@/app/core/services/cart.service';

@Component({
    selector: 'app-cart-page',
    imports: [CommonModule, TagModule, ButtonModule, CardModule, TableModule, RouterModule],
    standalone: true,
    templateUrl: './cart-page.html',
    styleUrl: './cart-page.scss'
})
export class CartPage implements OnInit {
    cartItems: CartItem[] = [];
    total = 0;
    tableNumber = '';
    constructor(
        private cartService: CartService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.loadCartItems();
    }
    loadCartItems(): void {
        this.cartItems = this.cartService.getCartItems();
        this.total = this.cartService.getCartTotal();
        this.tableNumber = this.cartService.getTableNumber();
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
    clearCart(): void {
        const confirm = window.confirm('Are you sure you want to clar the cart');
        if (!confirm) {
            return;
        }
        this.cartService.clearCart();
        this.loadCartItems();
    }
    goBackToMenu(): void {
      this.router.navigate(['/qr-menu', this.tableNumber || 'T1']);
    }
    goToCheckOut(): void {
        this.router.navigate(['/checkout']);
    }
}
