import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '@/app/layout/service/layout.service';
import { AuthService } from '@/app/core/services/auth.service';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RestaurantService } from '@/app/core/services/restaurant.service';
import { AdminHeaderService } from '@/app/core/services/adminheader.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator, ButtonModule],
    template: ` <div class="layout-topbar">
            <div class="layout-topbar-logo-container">
                <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                    <i class="pi pi-bars"></i>
                </button>
                <a class="layout-topbar-logo" routerLink="/">
                    <span class="brand-mark">R</span>
                    <span>{{ restaurant?.name }}</span>
                </a>
            </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi ': true, 'pi-sun': layoutService.isDarkTheme(), 'pi-moon': !layoutService.isDarkTheme() }"></i>
                </button>
                <div class="relative">
                    <button
                        class="layout-topbar-action layout-topbar-action-highlight"
                        pStyleClass="@next"
                        enterFromClass="hidden"
                        enterActiveClass="animate-scalein"
                        leaveToClass="hidden"
                        leaveActiveClass="animate-fadeout"
                        [hideOnOutsideClick]="true"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <app-configurator />
                </div>
            </div>

            <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu  lg:block">
                <div class="layout-topbar-menu-content">
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-calendar"></i>
                        <span>Calendar</span>
                    </button>
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-inbox"></i>
                        <span>Messages</span>
                    </button>
                    <button type="button" class="layout-topbar-action" routerLink="/profile/security">
                        <i class="pi pi-user"></i>
                        <span>Reset Password</span>
                    </button>

                    <div class="flex align-items-center gap-2">
                        <span class="font-medium">{{ authService.getUsername() }}</span>
                    </div>
                    <div class="px-3 py-2">
                        <button pButton type="button" icon="pi pi-sign-out" label="Logout" severity="secondary" class="p-button-sm w-full" (click)="logout()"></button>
                    </div>
                </div>
            </div>
        </div>
    </div>`
})
export class AppTopbar implements OnInit {
    constructor(
        public authService: AuthService,
        private router: Router,
        private rdf:ChangeDetectorRef,
        public api: AdminHeaderService
    ) {}

    restaurant: any;

    ngOnInit() {
        this.api.getRestaurant().subscribe((res) => {
            this.restaurant = res;
            this.rdf.markForCheck();
            console.log('from top bar', (this.restaurant = res));
        });
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    items!: MenuItem[];

    layoutService = inject(LayoutService);

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({
            ...state,
            darkTheme: !state.darkTheme
        }));
    }
}
