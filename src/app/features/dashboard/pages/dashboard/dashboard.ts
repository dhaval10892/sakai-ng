import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { Subscription, forkJoin, timer } from 'rxjs';

import { DashboardService } from '../../../../core/services/dashboard.service';
import { DashboardSummary } from '../../../../core/models/dashboard-summary.model';
import { ReportSummary } from '../../../../core/models/report-summary.model';
import { Order } from '../../../../core/models/order.model';
import { Payment } from '@/app/core/models/payment.model';
import { AdminHeaderService } from '@/app/core/services/adminheader.service';
import { OrdersService } from '@/app/core/services/orders.service';
import { PaymentService } from '@/app/core/services/payment.service';
import { BookingRequestService } from '@/app/core/services/booking-request.service';
import { NotificationService } from '@/app/core/services/notification.service';
import { resolveCurrencySymbol } from '@/app/core/utils/tenant-localization';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChartModule, ProgressSpinnerModule, TagModule, DialogModule, ButtonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit, OnDestroy {
  summary: DashboardSummary = {
    totalOrders: 0,
    activeTables: 0,
    availableMenuItems: 0,
    totalSales: 0
  };

  revenueSummary: ReportSummary = {
    totalOrders: 0,
    activeTables: 0,
    paidRevenue: 0,
    unpaidServedOrders: 0,
    totalPayments: 0,
    cashPayments: 0,
    cardPayments: 0,
    qrPayments: 0
  };

  recentOrders: Order[] = [];
  mostOrderedItem = 'N/A';
  loading = false;

  revenueChartData: any;
  revenueChartOptions: any;

  paymentChartData: any;
  paymentChartOptions: any;
  currencySymbol = '\u20B9';
  todayTipAmount = 0;
  biweeklyTipAmount = 0;
  pendingBookingCount = 0;
  pendingTakeawayCount = 0;
  activeTakeawayOrders: Order[] = [];
  latestAdminAlerts: string[] = [];
  biweeklyTipDialogVisible = false;
  private refreshSubscription?: Subscription;
  private hasLoadedSignals = false;
  private lastPendingBookingCount = 0;
  private lastPendingTakeawayCount = 0;
  private lastTodayTipAmount = 0;

  constructor(
    private dashboardService: DashboardService,
    private rdf: ChangeDetectorRef,
    private adminHeaderService: AdminHeaderService,
    private ordersService: OrdersService,
    private paymentService: PaymentService,
    private bookingRequestService: BookingRequestService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadRestaurantLocalization();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  loadRestaurantLocalization(): void {
    this.adminHeaderService.getRestaurant().subscribe({
      next: (restaurant) => {
        this.currencySymbol = resolveCurrencySymbol(restaurant?.currencySymbol, restaurant?.country, restaurant?.currencyCode);
        this.rdf.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load dashboard localization', error);
      }
    });
  }

  startAutoRefresh(): void {
    this.refreshSubscription?.unsubscribe();
    this.refreshSubscription = timer(0, 10000).subscribe(() => {
      this.loadDashboard();
      this.loadOperationalSignals();
    });
  }

  loadDashboard(): void {
    this.loading = true;

    let completedCalls = 0;
    const totalCalls = 4;

    const markComplete = () => {
      completedCalls++;
      this.rdf.markForCheck();
      if (completedCalls === totalCalls) {
        this.loading = false;
      }
    };

    this.dashboardService.getSummary().subscribe({
      next: (summary) => {
        this.summary = summary;
        this.initCharts();
        markComplete();
      },
      error: (error) => {
        console.error('Failed to load dashboard summary', error);
        markComplete();
      }
    });

    this.dashboardService.getRevenueSummary().subscribe({
      next: (summary) => {
        this.revenueSummary = summary;
        this.initCharts();
        markComplete();
      },
      error: (error) => {
        console.error('Failed to load revenue summary', error);
        markComplete();
      }
    });

    this.dashboardService.getRecentOrders().subscribe({
      next: (orders) => {
        this.recentOrders = orders;
        markComplete();
        
      },
      error: (error) => {
        console.error('Failed to load recent orders', error);
        markComplete();
      }
    });

    this.dashboardService.getMostOrderedItem().subscribe({
      next: (item) => {
        this.mostOrderedItem = item || 'N/A';
        markComplete();
        this.rdf.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load most ordered item', error);
        markComplete();
      }
    });
  }

  loadOperationalSignals(): void {
    forkJoin({
      payments: this.paymentService.getPayments(),
      orders: this.ordersService.getAllOrders(),
      bookings: this.bookingRequestService.getAll()
    }).subscribe({
      next: ({ payments, orders, bookings }) => {
        this.applyOperationalSignals(payments, orders, bookings);
        this.rdf.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load dashboard operational signals', error);
      }
    });
  }

  initCharts(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#334155';
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#64748b';
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#e2e8f0';

    this.revenueChartData = {
      labels: ['Orders', 'Payments', 'Active Tables', 'Available Items'],
      datasets: [
        {
          label: 'Restaurant Overview',
          data: [
            this.summary.totalOrders,
            this.revenueSummary.totalPayments,
            this.summary.activeTables,
            this.summary.availableMenuItems
          ],
          borderRadius: 10
        }
      ]
    };

    this.revenueChartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 1.8,
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        }
      }
    };

    this.paymentChartData = {
      labels: ['Cash', 'Card', 'QR Payment'],
      datasets: [
        {
          data: [
            this.revenueSummary.cashPayments,
            this.revenueSummary.cardPayments,
            this.revenueSummary.qrPayments
          ],
          hoverOffset: 6
        }
      ]
    };

    this.paymentChartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 1,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            usePointStyle: true
          }
        }
      }
    };
  }

  getOrderSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch ((status || '').toLowerCase()) {
      case 'paid':
      case 'served':
        return 'success';
      case 'ready':
        return 'info';
      case 'preparing':
        return 'warn';
      case 'pending':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  dismissBiweeklyTipDialog(): void {
    this.biweeklyTipDialogVisible = false;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.getBiweeklyStorageKey(), 'seen');
    }
  }

  private applyOperationalSignals(payments: Payment[], orders: Order[], bookings: { status: string; guestName: string; bookingDate: string; bookingTime: string }[]): void {
    const pendingBookings = bookings.filter((booking) => booking.status === 'Pending');
    const takeawayOrders = orders.filter((order) => this.isTakeaway(order) && this.isTakeawayActive(order.status));
    const todayTipAmount = this.getTipTotal(payments, 1);
    const biweeklyTipAmount = this.getTipTotal(payments, 14);

    this.pendingBookingCount = pendingBookings.length;
    this.pendingTakeawayCount = takeawayOrders.length;
    this.activeTakeawayOrders = takeawayOrders.slice(0, 4);
    this.todayTipAmount = todayTipAmount;
    this.biweeklyTipAmount = biweeklyTipAmount;
    this.latestAdminAlerts = [
      pendingBookings[0]
        ? `New booking: ${pendingBookings[0].guestName} on ${pendingBookings[0].bookingDate} at ${pendingBookings[0].bookingTime}`
        : 'No pending table bookings right now.',
      takeawayOrders[0]
        ? `Takeaway order #${takeawayOrders[0].id} is waiting for kitchen packing.`
        : 'No takeaway packing orders right now.'
    ];

    if (this.hasLoadedSignals) {
      if (this.pendingBookingCount > this.lastPendingBookingCount) {
        this.notificationService.warn('Admin alert', 'A new table booking request needs confirmation.');
      }

      if (this.pendingTakeawayCount > this.lastPendingTakeawayCount) {
        this.notificationService.warn('Admin alert', 'A new takeaway order needs kitchen packing.');
      }

      if (this.todayTipAmount > this.lastTodayTipAmount) {
        this.notificationService.success('Tips updated', `Today tips are now ${this.currencySymbol}${this.todayTipAmount.toFixed(2)}.`);
      }
    }

    this.lastPendingBookingCount = this.pendingBookingCount;
    this.lastPendingTakeawayCount = this.pendingTakeawayCount;
    this.lastTodayTipAmount = this.todayTipAmount;
    this.hasLoadedSignals = true;

    if (
      this.biweeklyTipAmount > 0 &&
      typeof localStorage !== 'undefined' &&
      !localStorage.getItem(this.getBiweeklyStorageKey())
    ) {
      this.biweeklyTipDialogVisible = true;
    }
  }

  private getTipTotal(payments: Payment[], days: number): number {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (days - 1));

    return payments
      .filter((payment) => payment.paymentStatus === 'Paid')
      .filter((payment) => {
        const sourceDate = payment.paidAt || payment.createdAt;
        return new Date(sourceDate) >= startDate;
      })
      .reduce((sum, payment) => sum + (payment.tipAmount || 0), 0);
  }

  private isTakeaway(order: Order): boolean {
    return (order.table || '').trim().toLowerCase() === 'takeaway';
  }

  private isTakeawayActive(status: string): boolean {
    const normalized = (status || '').trim().toLowerCase();
    return normalized !== 'served' && normalized !== 'paid';
  }

  private getBiweeklyStorageKey(): string {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 13);
    return `dashboard-biweekly-tips-${startDate.toISOString().slice(0, 10)}`;
  }
}
