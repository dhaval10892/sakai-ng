import { ChangeDetectorRef, Component } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

import { RestaurantTable } from '../../../../core/models/table.model';
import { TablesService } from '../../../../core/services/tables.service';

@Component({
  selector: 'app-table-list',
  standalone: true,
  imports: [
    TagModule,
    TabsModule,
    CommonModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    FormsModule,
    SelectModule
  ],
  templateUrl: './table-list.html',
  styleUrl: './table-list.scss',
})
export class TableList {
  tables: RestaurantTable[] = [];
  isEditMode = false;
  isVisible = false;
  loading = false;

  currentTable: RestaurantTable = this.getEmptyTable();

  statusOptions = [
    { label: 'Available', value: 'Available' },
    { label: 'Occupied', value: 'Occupied' },
    { label: 'Reserved', value: 'Reserved' }
  ];

  constructor(
    private tablesService: TablesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTables();
  }

  loadTables(): void {
    this.loading = true;
    this.tablesService.getAllTables().subscribe({
      next: (tables) => {
        this.tables = tables;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load tables', error);
        this.loading = false;
        alert('Failed to load tables from API.');
      }
    });
  }

  getEmptyTable(): RestaurantTable {
    return {
      id: 0,
      number: '',
      seats: 0,
      status: '',
    };
  }

  openAddDialog(): void {
    this.isEditMode = false;
    this.currentTable = this.getEmptyTable();
    this.isVisible = true;
  }

  openEditDialog(editDialogTable: RestaurantTable): void {
    this.isEditMode = true;
    this.currentTable = { ...editDialogTable };
    this.isVisible = true;
  }

  saveTable(): void {
    this.currentTable.number = this.currentTable.number.trim().toUpperCase();

    if (!this.currentTable.number || this.currentTable.seats <= 0) {
      alert('Please enter a valid table number and seats.');
      return;
    }

    const duplicateTable = this.tables.some(
      (x) =>
        x.number.trim().toLowerCase() === this.currentTable.number.trim().toLowerCase() &&
        x.id !== this.currentTable.id
    );

    if (duplicateTable) {
      alert('Table number already exists.');
      return;
    }

    if (this.isEditMode) {
      this.tablesService.updateTable(this.currentTable).subscribe({
        next: () => {
          this.loadTables();
          this.isVisible = false;
          this.currentTable = this.getEmptyTable();
        },
        error: (error) => {
          console.error('Failed to update table', error);
          alert('Failed to update table.');
        }
      });
    } else {
      this.tablesService.addTable(this.currentTable).subscribe({
        next: () => {
          this.loadTables();
          this.isVisible = false;
          this.currentTable = this.getEmptyTable();
        },
        error: (error) => {
          console.error('Failed to add table', error);
          alert('Failed to add table.');
        }
      });
    }
  }

  markAvailable(table: RestaurantTable): void {
    this.tablesService.updateTableStatus(table.number, 'Available').subscribe({
      next: () => {
        this.loadTables();
      },
      error: (error) => {
        console.error('Failed to update table status', error);
        alert('Failed to update table status.');
      }
    });
  }

  deleteTable(id: number): void {
    const confirmed = window.confirm('Are you sure you want to delete this table?');
    if (!confirmed) return;

    this.tablesService.deleteTable(id).subscribe({
      next: () => {
        this.loadTables();
      },
      error: (error) => {
        console.error('Failed to delete table', error);
        alert('Failed to delete table.');
      }
    });
  }

  getSeverity(status: string) {
    switch (status) {
      case 'Available':
        return 'success';
      case 'Reserved':
        return 'warn';
      case 'Occupied':
        return 'danger';
      default:
        return 'info';
    }
  }
}