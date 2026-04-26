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
import { timer, Subscription, switchMap } from 'rxjs';

import { RestaurantTable } from '../../../../core/models/table.model';
import { TablesService } from '../../../../core/services/tables.service';
import { BookingRequest } from '@/app/core/models/booking-request.model';
import { BookingRequestService } from '@/app/core/services/booking-request.service';
import { NotificationService } from '@/app/core/services/notification.service';

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
  bookingRequests: BookingRequest[] = [];
  isEditMode = false;
  isVisible = false;
  loading = false;
  qrDialogVisible = false;
  selectedQrTable?: RestaurantTable;
  private refreshSubscription?: Subscription;
  private knownPendingBookingIds = new Set<number>();
  private hasLoadedBookings = false;

  currentTable: RestaurantTable = this.getEmptyTable();

  statusOptions = [
    { label: 'Available', value: 'Available' },
    { label: 'Occupied', value: 'Occupied' },
    { label: 'Reserved', value: 'Reserved' }
  ];

  constructor(
    private tablesService: TablesService,
    private cdr: ChangeDetectorRef,
    private bookingRequestService: BookingRequestService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  startAutoRefresh(): void {
    this.refreshSubscription?.unsubscribe();
    this.refreshSubscription = timer(0, 5000)
      .pipe(switchMap(() => this.bookingRequestService.getAll()))
      .subscribe({
        next: (bookings) => {
          this.bookingRequests = bookings;
          this.notifyNewBookings(bookings);
          this.loadTables(false);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to refresh booking requests', error);
        }
      });
  }

  loadTables(showLoader = true): void {
    this.loading = showLoader;
    this.tablesService.getAllTables().subscribe({
      next: (tables) => {
        this.tables = tables;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load tables', error);
        this.loading = false;
        this.notificationService.showApiError(error, 'Failed to load tables from API.');
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
      this.notificationService.warn('Invalid table', 'Please enter a valid table number and seats.');
      return;
    }

    const duplicateTable = this.tables.some(
      (x) =>
        x.number.trim().toLowerCase() === this.currentTable.number.trim().toLowerCase() &&
        x.id !== this.currentTable.id
    );

    if (duplicateTable) {
      this.notificationService.warn('Duplicate table', 'Table number already exists.');
      return;
    }

    if (this.isEditMode) {
      this.tablesService.updateTable(this.currentTable).subscribe({
        next: () => {
          this.loadTables();
          this.isVisible = false;
          this.currentTable = this.getEmptyTable();
          this.notificationService.success('Table updated', 'Table updated successfully.');
        },
        error: (error) => {
          console.error('Failed to update table', error);
          this.notificationService.showApiError(error, 'Failed to update table.');
        }
      });
    } else {
      this.tablesService.addTable(this.currentTable).subscribe({
        next: () => {
          this.loadTables();
          this.isVisible = false;
          this.currentTable = this.getEmptyTable();
          this.notificationService.success('Table created', 'Table created successfully.');
        },
        error: (error) => {
          console.error('Failed to add table', error);
          this.notificationService.showApiError(error, 'Failed to add table.');
        }
      });
    }
  }

  markAvailable(table: RestaurantTable): void {
    this.tablesService.updateTableStatus(table.number, 'Available').subscribe({
      next: () => {
        this.loadTables();
        this.notificationService.success('Table updated', `Table ${table.number} marked available.`);
      },
      error: (error) => {
        console.error('Failed to update table status', error);
        this.notificationService.showApiError(error, 'Failed to update table status.');
      }
    });
  }

  deleteTable(id: number): void {
    const confirmed = window.confirm('Are you sure you want to delete this table?');
    if (!confirmed) return;

    this.tablesService.deleteTable(id).subscribe({
      next: () => {
        this.loadTables();
        this.notificationService.success('Table deleted', 'Table deleted successfully.');
      },
      error: (error) => {
        console.error('Failed to delete table', error);
        this.notificationService.showApiError(error, 'Failed to delete table.');
      }
    });
  }

  confirmBooking(booking: BookingRequest): void {
    this.bookingRequestService.updateStatus(booking.id, 'Confirmed').subscribe({
      next: () => {
        this.tablesService.updateTableStatus(booking.tableNumber, 'Reserved').subscribe({
          next: () => {
            this.notificationService.success('Booking confirmed', `Booking for ${booking.tableNumber} confirmed.`);
            this.startAutoRefresh();
          },
          error: (error) => {
            this.notificationService.showApiError(error, 'Booking confirmed, but failed to reserve the table.');
          }
        });
      },
      error: (error) => {
        this.notificationService.showApiError(error, 'Failed to confirm booking.');
      }
    });
  }

  rejectBooking(booking: BookingRequest): void {
    this.bookingRequestService.updateStatus(booking.id, 'Rejected').subscribe({
      next: () => {
        this.notificationService.success('Booking updated', `Booking #${booking.id} rejected.`);
        this.startAutoRefresh();
      },
      error: (error) => {
        this.notificationService.showApiError(error, 'Failed to reject booking.');
      }
    });
  }

  openQrDialog(table: RestaurantTable): void {
    this.selectedQrTable = table;
    this.qrDialogVisible = true;
  }

  getOrderUrl(table: RestaurantTable): string {
    return `${window.location.origin}/qr-menu/${encodeURIComponent(table.number)}`;
  }

  getQrImageUrl(table: RestaurantTable): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(this.getOrderUrl(table))}`;
  }

  private notifyNewBookings(bookings: BookingRequest[]): void {
    const pendingBookings = bookings.filter((booking) => booking.status === 'Pending');
    const latestPendingIds = new Set(pendingBookings.map((booking) => booking.id));

    if (this.hasLoadedBookings) {
      pendingBookings
        .filter((booking) => !this.knownPendingBookingIds.has(booking.id))
        .forEach((booking) => {
          this.notificationService.success(
            'New table booking',
            `${booking.guestName} requested ${booking.seats} seats on ${booking.bookingDate} at ${booking.bookingTime}.`
          );
        });
    }

    this.knownPendingBookingIds = latestPendingIds;
    this.hasLoadedBookings = true;
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
