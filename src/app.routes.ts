import { Routes } from '@angular/router';
import { authGuard } from './app/core/guards/auth.guard';
import { roleGuard } from './app/core/guards/role.guard';

import { AdminLayout } from './app/layout/admin-layout/admin-layout';


export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./app/features/auth/pages/login-page/login-page').then((m) => m.LoginPage)
    },

    {
        path: 'qr-menu/:tableNumber',
        loadComponent: () => import('./app/features/public-menu/pages/public-menu/public-menu').then((m) => m.PublicMenu)
    },
    {
        path: 'cart',
        loadComponent: () => import('./app/features/cart/pages/cart-page/cart-page').then((m) => m.CartPage)
    },
    {
        path: 'checkout',
        loadComponent: () => import('./app/features/checkout/pages/checkout-page/checkout-page').then((m) => m.CheckoutPage)
    },
    {
        path: 'order-success',
        loadComponent: () => import('./app/features/checkout/pages/order-success/order-success').then((m) => m.OrderSuccess)
    },
    {
        path: 'super-admin',
        component: AdminLayout,
        canActivate: [authGuard],
        data: { roles: ['SuperAdmin'] },
        children: [
            {
                path: '',
                loadComponent: () => import('./app/features/super-admin/dashboard/dashboard').then((m) => m.Dashboard)
            },
            {
                path: 'restaurants',
                loadComponent: () => import('./app/features/super-admin/restaurants/restaurants').then((m) => m.Restaurants)
            },
            {
                path: 'restaurants/create',
                loadComponent: () => import('./app/features/super-admin/create-restaurant/create-restaurant').then((m) => m.CreateRestaurant)
            }
        ]
    },

    {
        path: '',
        loadComponent: () => import('./app/layout/component/app.layout').then((m) => m.AppLayout),
        canActivate: [authGuard],
        children: [
            {
                path: 'dashboard',
                canActivate: [roleGuard],
                data: { roles: ['Admin'] },
                loadComponent: () => import('./app/features/dashboard/pages/dashboard/dashboard').then((m) => m.Dashboard)
            },
            {
                path: 'admin/menu',
                canActivate: [roleGuard],
                data: { roles: ['Admin'] },
                loadComponent: () => import('./app/features/menu/pages/menu-list/menu-list').then((m) => m.MenuList)
            },
            {
                path: 'admin/categories',
                canActivate: [roleGuard],
                data: { roles: ['Admin'] },
                loadComponent: () => import('./app/features/categories/pages/category-list/category-list').then((m) => m.CategoryList)
            },
            {
                path: 'tables',
                canActivate: [roleGuard],
                data: { roles: ['Admin'] },
                loadComponent: () => import('./app/features/table/pages/table-list/table-list').then((m) => m.TableList)
            },
            {
                path: 'orders',
                canActivate: [roleGuard],
                data: { roles: ['Admin'] },
                loadComponent: () => import('./app/features/orders/pages/order-list/order-list').then((m) => m.OrderList)
            },
            {
                path: 'kitchen',
                canActivate: [roleGuard],
                data: { roles: ['Kitchen', 'Admin'] },
                loadComponent: () => import('./app/features/kitchen/pages/kitchen-board/kitchen-board').then((m) => m.KitchenBoard)
            },
            {
                path: 'waiter',
                canActivate: [roleGuard],
                data: { roles: ['Waiter', 'Admin'] },
                loadComponent: () => import('./app/features/waiter/pages/waiter-dashboard/waiter-dashboard').then((m) => m.WaiterDashboard)
            },
            {
                path: 'billing',
                canActivate: [roleGuard],
                data: { roles: ['Billing', 'Admin'] },
                loadComponent: () => import('./app/features/billing/pages/billing-list/billing-list').then((m) => m.BillingList)
            },
            {
                path: 'reports',
                canActivate: [roleGuard],
                data: { roles: ['Billing', 'Admin'] },
                loadComponent: () => import('./app/features/reports/pages/reports-dashboard/reports-dashboard').then((m) => m.ReportsDashboard)
            },
            {
                path: 'admin/users',
                canActivate: [authGuard, roleGuard],
                data: { roles: ['Admin'] },
                loadComponent: () => import('./app/features/users/pages/user-list/user-list').then((m) => m.UserList)
            },
            {
                path: 'profile/security',
                canActivate: [authGuard],
                loadComponent: () => import('./app/features/profile/pages/security-page/security-page').then((m) => m.SecurityPage)
            },
            {
                path: 'admin/activity-logs',
                canActivate: [authGuard, roleGuard],
                data: { roles: ['Admin'] },
                loadComponent: () => import('./app/features/activity-logs/pages/activity-log-list/activity-log-list').then((m) => m.ActivityLogList)
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    },

    {
        path: '**',
        redirectTo: 'login'
    }
];
