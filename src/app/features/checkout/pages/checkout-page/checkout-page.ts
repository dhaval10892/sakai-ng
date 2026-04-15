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
import { OrdersService } from '@/app/core/services/orders.service';
import { Order } from '@/app/core/models/order.model';
import { PaymentOption } from '@/app/core/models/payment-option.model';
import { TablesService } from '@/app/core/services/tables.service';
import { OrderItem } from '@/app/core/models/order-item.model';

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
    selectedPaymentMode = 'Cash';
    loading=false;
    paymentOption: PaymentOption[] = [
        { label: 'Cash', value: 'Cash' },
        { label: 'Card', value: 'Card' },
        { label: 'QR Payment', value: 'QR Payment' }
    ];
    constructor(
        private cartService: CartService,
        private orderService: OrdersService,
        private router: Router,
        private tableService: TablesService
    ) {}

    ngOnInit(): void {
        this.loadCheckOutData();
    }
    loadCheckOutData(): void {
        this.cartItems = this.cartService.getCartItems();
        this.total = this.cartService.getCartTotal();
        this.tableNumber = this.cartService.getTableNumber();
    }
    placeOrder(): void {
        if (!this.tableNumber) {
            alert('Table number is missing.');
            return;
        }
        if (this.cartItems.length === 0) {
            alert('Your cart is empty');
            return;
        }
        this.loading=true;
       const structuredItem:OrderItem[]=this.cartItems.map((item,index)=>({
            id:0,
            menuItemId:item.menuItem.id,
            menuItemName:item.menuItem.categoryName,
            quantity:item.quantity,
            unitPrice:item.menuItem.price,
            totalPrice:item.menuItem.price * item.quantity
            
       }));
       const itemsText = structuredItem
  .map((item) => `${item.menuItemName} x${item.quantity}`)
  .join(', ');

const newOrder: Order = {
  id: 0,
  table: this.tableNumber,
  total: this.total,
  status: 'Preparing',
  createdAt: new Date().toISOString(),
  itemsText:itemsText,
  items: structuredItem
};


        this.orderService.addOrder(newOrder).subscribe({
            next: () => {
                debugger;
                this.tableService.updateTableStatus(this.tableNumber, 'Occupied').subscribe({
                    next: () => {
                        this.cartService.clearCart();
                        this.loading=false;
                        alert(`Order placed successfully using ${this.selectedPaymentMode}.`);
                        this.router.navigate(['/order-success'], {
                            queryParams: {
                                table: this.tableNumber,
                                payment: this.selectedPaymentMode
                            }
                        });
                    },
                    error: (error) => {
                      console.error('Failed to update table status', error);
                      this.loading=false;
                        alert('Order created, but failed to update table status.');
                    }
                });
            },
            error: (error) => {
                console.error('Failed to place order', error);
                this.loading=false;
                alert('Failed to place order.');
            }
        });
    }
    goBackToCart(): void {
        this.router.navigate(['/cart']);
    }
}
