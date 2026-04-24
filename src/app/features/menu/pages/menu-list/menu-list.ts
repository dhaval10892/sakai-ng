import { Component } from '@angular/core';
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
import {  Observable } from 'rxjs';
import {  Select } from 'primeng/select';

import { MenuItem } from '../../../../core/models/menu-items.model';
import { MenuService } from '../../../../core/services/menu.service';
import { MenuCategory } from '@/app/core/models/menu-category.model';
import { MenuCategoryService } from '@/app/core/services/menu-category.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
    selector: 'app-menu-list',
    standalone: true,
    imports: [TagModule, FormsModule, TableModule, CommonModule, ButtonModule, DialogModule, InputNumberModule, InputTextModule, InputNumberModule, CheckboxModule, AccordionModule, Select],
    templateUrl: './menu-list.html',
    styleUrl: './menu-list.scss'
})
export class MenuList {
    menuItems!: Observable<MenuItem[]>;
    dialogVisible = false;
    isEditMode = false;
    loading = false;
    currentItem: MenuItem = this.getEmptyMenuItem();
    categoryOptions: { label: string; value: number }[] = [];
    categories: MenuCategory[] = [];
    selectedFile: File | null = null;
    uploading = false;

    constructor(
        private menuService: MenuService,
        private menuCategoryService: MenuCategoryService,
        private rdf: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadMenuItem();
        this.loadCategory();
        console.log(this.categoryOptions, 'load');
    }
    loadMenuItem(): void {
        this.loading = true;
        this.menuItems = this.menuService.getAllMenuItems();

        this.menuItems.subscribe({
            next: (items) => {
                console.log(items.map((x) => x.categoryName));
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
    console.log(imageUrl);

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }

    return imageUrl;
}

    getEmptyMenuItem(): MenuItem {
        return {
            id: 0,
            name: '',
            menuCategoryId: 0,
            categoryName: '',
            price: 0,
            available: true,
            imageUrl: ''
        };
    }
    loadCategory(): void {
        this.menuCategoryService.getCategories().subscribe({
            next: (categories: MenuCategory[]) => {
                this.categories = categories;
                this.categoryOptions = categories.map((category) => ({
                    label: category.name,
                    value: category.id
                }));
                console.log(this.categoryOptions);
                
            },
            error: (error) => {
                console.log('Faild to load category', error);
                alert('Failed to load category ');
            }
        });
    }
    openAddDialog(): void {
        this.isEditMode = false;
        this.currentItem = this.getEmptyMenuItem();
        this.selectedFile = null;
        this.dialogVisible = true;
    }
    openEditDialog(item: MenuItem): void {
        this.isEditMode = true;
        this.currentItem = { ...item };
        this.selectedFile = null;
        this.dialogVisible = true;
    }
    saveItem(): void {
        if (!this.currentItem.name.trim() || this.currentItem.menuCategoryId <= 0 || this.currentItem.price <= 0) {
            alert('Please fill all required fields correctly.');
            return;
        }

        if (this.selectedFile) {
            this.uploading = true;

            this.menuService.uploadImage(this.selectedFile).subscribe({
                next: (response) => {
                    this.currentItem.imageUrl = response.imageUrl;
                    this.uploading = false;
                    this.saveMenuItemData();
                    this.rdf.detectChanges();

                },
                error: (error) => {
                    console.error('Failed to upload image', error);
                    this.uploading = false;
                    alert('Failed to upload image.');
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
                    this.loadMenuItem();
                    this.dialogVisible = false;
                    this.currentItem = this.getEmptyMenuItem();
                    this.selectedFile = null;
                },
                error: (error) => {
                    console.error('Failed to update menu item', error);
                    alert('Failed to update menu item.');
                }
            });
        } else {
            this.menuService.addMenuItems(this.currentItem).subscribe({
                next: () => {
                    this.loadMenuItem();
                    this.dialogVisible = false;
                    this.currentItem = this.getEmptyMenuItem();
                    this.selectedFile = null;
                },
                error: (error) => {
                    console.error('Failed to add menu item', error);
                    alert('Failed to add menu item.');
                }
            });
        }
    }
    deleteItem(id: number): void {
        const confirm = window.confirm('Are you sure you want to delete this menu item?');
        if (!confirm) {
            return;
        }
        this.menuService.deleteMenuItem(id).subscribe({
            next: () => {
                this.loadMenuItem();
            },
            error: (error) => {
                console.log('Failed to delete the menu item', error);
                alert('Failed to dalete the menu item');
            }
        });
    }
}
