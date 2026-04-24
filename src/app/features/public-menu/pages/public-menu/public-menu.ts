import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { GalleriaModule } from 'primeng/galleria';
import { ImageModule } from 'primeng/image';
 import { DrawerModule } from 'primeng/drawer';

import { PhotoService } from '@/app/pages/service/photo.service';
import { Product, ProductService } from '@/app/pages/service/product.service';

import { MenuService } from '@/app/core/services/menu.service';
import { MenuItem } from '@/app/core/models/menu-items.model';
import { CartService } from '@/app/core/services/cart.service';
import { CartItem } from '@/app/core/models/cart-item.model';
import { ChangeDetectorRef } from '@angular/core';
import { Carousel } from 'primeng/carousel';
import { OrdersService } from '@/app/core/services/orders.service';
import { Tab } from "primeng/tabs";

@Component({
    selector: 'app-public-menu',
    standalone: true,
    imports: [TagModule, ButtonModule, TableModule, DrawerModule, CommonModule, CardModule, RouterModule, GalleriaModule, ImageModule, Carousel, TableModule],
    templateUrl: './public-menu.html',
    styleUrl: './public-menu.scss'
})
export class PublicMenu implements OnInit {
    tableNumber = '';
    cartCount = 0;
    availableMenuItem: MenuItem[] = [];
    categories: string[] = [];
    selectedCategory = 'All';
    filteredItems: MenuItem[] = [];
    cartVisible = false;
    loading = false;
    cartItems: CartItem[] = [];
    total = 0;

    constructor(
        private activeRoute: ActivatedRoute,
        private menuService: MenuService,
        private router: Router,
        private cartService: CartService,
        private cdr: ChangeDetectorRef
    ) {}
    ngOnInit(): void {
        this.loadMenuItems();
        
        this.tableNumber = this.activeRoute.snapshot.paramMap.get('tableNumber') || '';
        this.cartService.setTableNumer(this.tableNumber);
        this.loadCartCount();
    }
    loadMenuItems(): void {
        this.loading = true;

        this.menuService.getAllMenuItems().subscribe({
            next: (items) => {
                console.log("hello");
                this.availableMenuItem = items.filter((item) => item.available);
                this.categories = ['All', ...new Set(this.availableMenuItem.map((item) => item.categoryName))];
                this.filteredItems = [...this.availableMenuItem];
                this.cdr.detectChanges();
                this.loading = false;
                console.log(this.availableMenuItem);
                
            },
            error: (error) => {
                console.error('Failed to load public menu', error);
                this.loading = false;
                alert('Failed to load menu items.');
            }
        });
    }
     carouselResponsiveOptions: any[] = [
        {
            breakpoint: '1024px',
            numVisible: 3,
            numScroll: 3
        },
        {
            breakpoint: '768px',
            numVisible: 2,
            numScroll: 2
        },
        {
            breakpoint: '560px',
            numVisible: 1,
            numScroll: 1
        }
    ];
    filterByCategory(category: string): void {
        this.selectedCategory = category;

        if (category === 'All') {
            this.filteredItems = this.availableMenuItem;
            return;
        }

        this.filteredItems = this.availableMenuItem.filter((item) => item.categoryName === category);
    }
    openCart(): void {
        this.cartVisible = true;
        this.loadCartCount();
    }

    closeCart(): void {
        this.cartVisible = false;
    }
    /*   loadMenuItem(): void {
           this.menuService.getAllMenuItems().subscribe((items: any[]) => {
            this.availableMenuItem = items.filter((x) => (x.available ?? x.Available) === true);
            console.log('Filtered available items:', this.availableMenuItem);
             this.cdr.detectChanges();
        });
    }*/
    loadCartCount(): void {
        this.cartCount = this.cartService.getCartCount();
    }
    addToCart(item: MenuItem): void {
        this.cartService.addCartItem(item, this.tableNumber);
        this.loadCartCount();
        this.loadCartSidebar();
    }
    goToCart(): void {
        this.router.navigate(['/cart']);
    }

    loadCartSidebar(): void {
        this.cartItems = this.cartService.getCartItems();
        this.total = this.cartService.getCartTotal();
        this.cartCount = this.cartService.getCartCount();
    }

    increaseQuantity(menuItemId: number): void {
        this.cartService.increaseQuantity(menuItemId);
        this.loadCartSidebar();
    }

    decreaseQuantity(menuItemId: number): void {
        this.cartService.decreaseQuantity(menuItemId);
        this.loadCartSidebar();
    }

    goToCheckout(): void {
        this.router.navigate(['/checkout']);
    }
}
