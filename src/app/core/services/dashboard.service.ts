import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';

import { OrdersService } from './orders.service';
import { TablesService } from './tables.service';
import { MenuService } from './menu.service';
import { PaymentService } from './payment.service';

import { DashboardSummary } from '../models/dashboard-summary.model';
import { ReportSummary } from '../models/report-summary.model';
import { Order } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(
    private ordersService: OrdersService,
    private tablesService: TablesService,
    private menuService: MenuService,
    private paymentService: PaymentService
  ) {}

  getSummary(): Observable<DashboardSummary> {
    return forkJoin({
      orders: this.ordersService.getAllOrders(),
      tables: this.tablesService.getAllTables(),
      menuItems: this.menuService.getAllMenuItems()
    }).pipe(
      map(({ orders, tables, menuItems }) => ({
        totalOrders: orders.length,
        activeTables: tables.filter(
          (t) => t.status === 'Occupied' || t.status === 'Reserved'
        ).length,
        availableMenuItems: menuItems.filter((m) => m.available).length,
        totalSales: orders.reduce((sum, order) => sum + order.total, 0)
      }))
    );
  }

  getRevenueSummary(): Observable<ReportSummary> {
    return forkJoin({
      orders: this.ordersService.getAllOrders(),
      tables: this.tablesService.getAllTables(),
      payments: this.paymentService.getPayments()
    }).pipe(
      map(({ orders, tables, payments }) => {
        const paidPayments = payments.filter((p) => p.paymentStatus === 'Paid');

        return {
          totalOrders: orders.length,
          activeTables: tables.filter(
            (t) => t.status === 'Occupied' || t.status === 'Reserved'
          ).length,
          paidRevenue: paidPayments.reduce((sum, p) => sum + p.amount, 0),
          unpaidServedOrders: orders.filter((order) => {
            const existingPayment = payments.find((p) => p.orderId === order.id);
            return order.status === 'Served' && !existingPayment;
          }).length,
          totalPayments: payments.length,
          cashPayments: paidPayments.filter((p) => p.paymentMethod === 'Cash').length,
          cardPayments: paidPayments.filter((p) => p.paymentMethod === 'Card').length,
          qrPayments: paidPayments.filter((p) => p.paymentMethod === 'QR Payment').length
        };
      })
    );
  }

  getRecentOrders(limit = 5): Observable<Order[]> {
    return this.ordersService.getAllOrders().pipe(
      map((orders) =>
        [...orders]
          .sort((a, b) => b.id - a.id)
          .slice(0, limit)
      )
    );
  }

  getMostOrderedItem(): Observable<string> {
    return this.ordersService.getAllOrders().pipe(
      map((orders) => {
        const itemCounts: Record<string, number> = {};

        orders.forEach((order) => {
          order.items.forEach((item) => {
            itemCounts[item.menuItemName] = (itemCounts[item.menuItemName] || 0) + item.quantity;
          });
        });

        let mostOrderedItem = 'N/A';
        let maxCount = 0;

        for (const item in itemCounts) {
          if (itemCounts[item] > maxCount) {
            maxCount = itemCounts[item];
            mostOrderedItem = item;
          }
        }

        return mostOrderedItem;
      })
    );
  }
}