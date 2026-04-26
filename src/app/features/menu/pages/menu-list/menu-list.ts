import { Component, OnInit } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { AccordionModule } from 'primeng/accordion';
import {  Select } from 'primeng/select';

import { MenuItem as RestaurantMenuItem } from '../../../../core/models/menu-items.model';
import { MenuService } from '../../../../core/services/menu.service';
import { MenuCategory } from '@/app/core/models/menu-category.model';
import { MenuCategoryService } from '@/app/core/services/menu-category.service';
import { ChangeDetectorRef } from '@angular/core';
import { NotificationService } from '@/app/core/services/notification.service';
import { AdminHeaderService } from '@/app/core/services/adminheader.service';
import { DEFAULT_COUNTRY, resolveCurrencySymbol } from '@/app/core/utils/tenant-localization';
import { finalize, forkJoin } from 'rxjs';

@Component({
    selector: 'app-menu-list',
    standalone: true,
    imports: [TagModule, FormsModule, TableModule, CommonModule, ButtonModule, DialogModule, InputNumberModule, InputTextModule, InputNumberModule, CheckboxModule, AccordionModule, Select],
    templateUrl: './menu-list.html',
    styleUrl: './menu-list.scss'
})
export class MenuList implements OnInit {
    menuItems: RestaurantMenuItem[] = [];
    dialogVisible = false;
    isEditMode = false;
    loading = false;
    currencySymbol = resolveCurrencySymbol(undefined, DEFAULT_COUNTRY, 'INR');
    currentItem: RestaurantMenuItem = this.getEmptyMenuItem();
    categoryOptions: { label: string; value: number }[] = [];
    categories: MenuCategory[] = [];
    selectedFile: File | null = null;
    uploading = false;

    constructor(
        private menuService: MenuService,
        private menuCategoryService: MenuCategoryService,
        private rdf: ChangeDetectorRef,
        private notificationService: NotificationService,
        private adminHeaderService: AdminHeaderService
    ) {}

    ngOnInit(): void {
        this.loadInitialData();
        this.loadRestaurantCurrency();
    }

    loadInitialData(): void {
        this.loading = true;

        forkJoin({
            items: this.menuService.getAllMenuItems(),
            categories: this.menuCategoryService.getCategories()
        })
            .pipe(
                finalize(() => {
                    this.loading = false;
                    this.rdf.markForCheck();
                })
            )
            .subscribe({
                next: ({ items, categories }) => {
                    this.menuItems = items;
                    this.categories = categories;
                    this.syncCategoryOptions();
                },
                error: (error) => {
                    this.notificationService.showApiError(error, 'Failed to load menu data.');
                }
            });
    }

    loadMenuItem(): void {
        this.loading = true;
        this.menuService.getAllMenuItems(true)
            .pipe(
                finalize(() => {
                    this.loading = false;
                    this.rdf.markForCheck();
                })
            )
            .subscribe({
                next: (items) => {
                    this.menuItems = items;
                },
                error: (error) => {
                    this.notificationService.showApiError(error, 'Failed to load menu items.');
                }
            });
    }
    onFileSelect(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;
        }
    }

    getImageUrl(imageUrl: string | undefined): string {
        if (!imageUrl) {
            return 'https://via.placeholder.com/80';
        }

        return imageUrl;
    }

    getCurrentStockQuantity(): number {
        return this.currentItem.stockQuantity;
    }

    setCurrentStockQuantity(value: number | null | undefined): void {
        this.currentItem.stockQuantity = value ?? 0;
    }

    getCurrentLowStockThreshold(): number {
        return this.currentItem.lowStockThreshold;
    }

    setCurrentLowStockThreshold(value: number | null | undefined): void {
        this.currentItem.lowStockThreshold = value ?? 0;
    }

    getItemStockQuantity(item: RestaurantMenuItem): number {
        return item.stockQuantity;
    }

    getItemLowStockThreshold(item: RestaurantMenuItem): number {
        return item.lowStockThreshold;
    }

    getEmptyMenuItem(): RestaurantMenuItem {
        return {
            id: 0,
            name: '',
            menuCategoryId: 0,
            categoryName: '',
            price: 0,
            available: true,
            stockQuantity: 0,
            lowStockThreshold: 5,
            imageUrl: ''
        };
    }
    loadCategory(): void {
        this.menuCategoryService.getCategories(true).subscribe({
            next: (categories: MenuCategory[]) => {
                this.categories = categories;
                this.syncCategoryOptions();
                this.rdf.markForCheck();
            },
            error: (error) => {
                this.notificationService.showApiError(error, 'Failed to load categories.');
            }
        });
    }
    loadRestaurantCurrency(): void {
        this.adminHeaderService.getRestaurant().subscribe({
            next: (restaurant) => {
                this.currencySymbol = resolveCurrencySymbol(restaurant?.currencySymbol, restaurant?.country, restaurant?.currencyCode);
            },
            error: () => {
                this.currencySymbol = this.currencySymbol;
            }
        });
    }
    openAddDialog(): void {
        this.isEditMode = false;
        this.currentItem = this.getEmptyMenuItem();
        this.selectedFile = null;
        this.dialogVisible = true;
    }
    openEditDialog(item: RestaurantMenuItem): void {
        this.isEditMode = true;
        this.currentItem = { ...item };
        this.selectedFile = null;
        this.dialogVisible = true;
    }
    saveItem(): void {
        this.currentItem.categoryName = this.categories.find((category) => category.id === this.currentItem.menuCategoryId)?.name ?? '';

        if (!this.currentItem.name.trim() || this.currentItem.menuCategoryId <= 0 || this.currentItem.price <= 0) {
            this.notificationService.warn('Invalid menu item', 'Please fill all required fields correctly.');
            return;
        }

        if (this.selectedFile) {
            this.uploading = true;

            this.menuService.uploadImage(this.selectedFile).subscribe({
                next: (response) => {
                    this.currentItem.imageUrl = response.imageUrl;
                    this.uploading = false;
                    this.saveMenuItemData();
                    this.rdf.markForCheck();

                },
                error: (error) => {
                    console.error('Failed to upload image', error);
                    this.uploading = false;
                    this.notificationService.showApiError(error, 'Failed to upload image.');
                }
            });
        } else {
            this.saveMenuItemData();
        }
    }
    saveMenuItemData(): void {
        if (this.isEditMode) {
            this.menuService.updateMenuItem(this.currentItem).subscribe({
                next: () => {
                    this.menuItems = this.menuItems
                        .map((item) => (item.id === this.currentItem.id ? { ...this.currentItem } : item))
                        .sort((left, right) => left.name.localeCompare(right.name));
                    this.dialogVisible = false;
                    this.currentItem = this.getEmptyMenuItem();
                    this.selectedFile = null;
                    this.notificationService.success('Menu updated', 'Menu item updated successfully.');
                    this.rdf.markForCheck();
                },
                error: (error) => {
                    console.error('Failed to update menu item', error);
                    this.notificationService.showApiError(error, 'Failed to update menu item.');
                }
            });
        } else {
            this.menuService.addMenuItems(this.currentItem).subscribe({
                next: (createdItem) => {
                    this.menuItems = [...this.menuItems, createdItem].sort((left, right) => left.name.localeCompare(right.name));
                    this.dialogVisible = false;
                    this.currentItem = this.getEmptyMenuItem();
                    this.selectedFile = null;
                    this.notificationService.success('Menu item created', 'New menu item saved successfully.');
                    this.rdf.markForCheck();
                },
                error: (error) => {
                    console.error('Failed to add menu item', error);
                    this.notificationService.showApiError(error, 'Failed to add menu item.');
                }
            });
        }
    }
    deleteItem(id: number): void {
        this.menuService.deleteMenuItem(id).subscribe({
            next: () => {
                this.menuItems = this.menuItems.filter((item) => item.id !== id);
                this.notificationService.success('Menu item deleted', 'The menu item was removed successfully.');
                this.rdf.markForCheck();
            },
            error: (error) => {
                console.log('Failed to delete the menu item', error);
                this.notificationService.showApiError(error, 'Failed to delete the menu item.');
            }
        });
    }

    private syncCategoryOptions(): void {
        this.categoryOptions = this.categories.map((category) => ({
            label: category.name,
            value: category.id
        }));
    }
}
