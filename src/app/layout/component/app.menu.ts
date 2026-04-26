import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '@/app/core/services/auth.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of model; track item.label) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `
})
export class AppMenu implements OnInit {
  model: any[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    const role = this.authService.getRole();

    const items: any[] = [];

    if (role === 'Admin') {
      items.push(
        { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/dashboard'] },
        { label: 'Menu', icon: 'pi pi-fw pi-book', routerLink: ['/admin/menu'] },
        { label: 'Categories', icon: 'pi pi-fw pi-tags', routerLink: ['/admin/categories'] },
        { label: 'Tables', icon: 'pi pi-fw pi-th-large', routerLink: ['/tables'] },
        { label: 'Orders', icon: 'pi pi-fw pi-shopping-cart', routerLink: ['/orders'] },
        { label: 'Kitchen', icon: 'pi pi-fw pi-inbox', routerLink: ['/kitchen'] },
        { label: 'Waiter', icon: 'pi pi-fw pi-users', routerLink: ['/waiter'] },
        { label: 'Billing', icon: 'pi pi-fw pi-credit-card', routerLink: ['/billing'] },
        { label: 'Reports', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/reports'] },
        { label: 'Users', icon: 'pi pi-fw pi-user', routerLink: ['/admin/users'] },
        { label: 'Activity Logs', icon: 'pi pi-fw pi-history', routerLink: ['/admin/activity-logs'] },
        { label: 'Reset Password', icon: 'pi pi-fw pi-lock', routerLink: ['/profile/security'] },
      );
    }

    if (role === 'Kitchen') {
      items.push(
        { label: 'Kitchen', icon: 'pi pi-fw pi-inbox', routerLink: ['/kitchen'] },
        { label: 'Reset Password', icon: 'pi pi-fw pi-lock', routerLink: ['/profile/security'] }
      );
    }

    if (role === 'Waiter') {
      items.push(
        { label: 'Waiter', icon: 'pi pi-fw pi-users', routerLink: ['/waiter'] },
        { label: 'Reset Password', icon: 'pi pi-fw pi-lock', routerLink: ['/profile/security'] }
      );
    }

    if (role === 'Billing') {
      items.push(
        { label: 'Billing', icon: 'pi pi-fw pi-credit-card', routerLink: ['/billing'] },
        { label: 'Reports', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/reports'] },
        { label: 'Reset Password', icon: 'pi pi-fw pi-lock', routerLink: ['/profile/security'] }
      );
    }

    this.model = [
      {
        label: 'Restaurant',
        items
      }
    ];
  }
}
