import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ChangeDetectorRef } from '@angular/core';

import { MenuCategory } from '../../../../core/models/menu-category.model';
import { MenuCategoryService } from '../../../../core/services/menu-category.service';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule
  ],
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss'
})
export class CategoryList implements OnInit {
  categories: MenuCategory[] = [];
  dialogVisible = false;
  isEditMode = false;
  loading = false;

  currentCategory: MenuCategory = this.getEmptyCategory();

  constructor(private menuCategoryService: MenuCategoryService, private rdf:ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;

    this.menuCategoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loading = false;
        this.rdf.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load categories', error);
        this.loading = false;
        alert('Failed to load categories from API.');
      }
    });
  }

  getEmptyCategory(): MenuCategory {
    return {
      id: 0,
      name: ''
    };
  }

  openAddDialog(): void {
    this.isEditMode = false;
    this.currentCategory = this.getEmptyCategory();
    this.dialogVisible = true;
  }

  openEditDialog(category: MenuCategory): void {
    this.isEditMode = true;
    this.currentCategory = { ...category };
    this.dialogVisible = true;
  }

  saveCategory(): void {
    this.currentCategory.name = this.currentCategory.name.trim();

    if (!this.currentCategory.name) {
      alert('Category name is required.');
      return;
    }

    const duplicateCategory = this.categories.some(
      (x) =>
        x.name.trim().toLowerCase() === this.currentCategory.name.trim().toLowerCase() &&
        x.id !== this.currentCategory.id
    );

    if (duplicateCategory) {
      alert('Category name already exists.');
      return;
    }

    if (this.isEditMode) {
      this.menuCategoryService.update(this.currentCategory.id,this.currentCategory).subscribe({
        next: () => {
          this.loadCategories();
          this.dialogVisible = false;
          this.currentCategory = this.getEmptyCategory();
        },
        error: (error) => {
          console.error('Failed to update category', error);
          alert('Failed to update category.');
        }
      });
    } else {
      this.menuCategoryService.createCategory(this.currentCategory).subscribe({
        next: () => {
          this.loadCategories();
          this.dialogVisible = false;
          this.currentCategory = this.getEmptyCategory();
        },
        error: (error) => {
          console.error('Failed to add category', error);
          alert('Failed to add category.');
        }
      });
    }
  }

  deleteCategory(id: number): void {
    const confirmed = window.confirm('Are you sure you want to delete this category?');
    if (!confirmed) return;

    this.menuCategoryService.delete(id).subscribe({
      next: () => {
        this.loadCategories();
      },
      error: (error) => {
        console.error('Failed to delete category', error);
        alert('Failed to delete category. It may be used by existing menu items.');
      }
    });
  }
}