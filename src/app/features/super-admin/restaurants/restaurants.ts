import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { RestaurantService } from '@/app/core/services/restaurant.service';
import { ChangeDetectorRef } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { jwtDecode } from 'jwt-decode';
import { Restaurant } from '@/app/core/models/restaurant';
import { PasswordDirective } from "primeng/password";
import { AuthService } from '@/app/core/services/auth.service';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { COUNTRY_OPTIONS, DEFAULT_COUNTRY, getCountryPreset } from '@/app/core/utils/tenant-localization';
import { NotificationService } from '@/app/core/services/notification.service';

@Component({
    selector: 'app-restaurants',
    standalone: true,
    imports: [CommonModule, RouterModule, TableModule, ButtonDirective, ButtonModule, DialogModule, InputTextModule, FormsModule, PasswordDirective, SelectModule, InputNumberModule],
    templateUrl: './restaurants.html',
    styleUrls: ['./restaurants.scss']
})
export class Restaurants implements OnInit {
    restaurants: any[] = [];
    loading = true;
    selectedRestaurant:any=this.getEmptyRestaurant();
    userRole: string = '';
    isEditMode = false;
    dialogVisible = false;
    countryOptions = COUNTRY_OPTIONS;
    stateOptions: { label: string; value: string }[] = [];
    
    constructor(
        private service: RestaurantService,
        private rdf: ChangeDetectorRef,
        private notificationService: NotificationService
    ) {
        
    }
    ngOnInit() {
        this.load();
        this.getRole();
        this.onCountryChange(this.selectedRestaurant.country, true);
    }
    getEmptyRestaurant():any{
        return {
               
                name:'',
                logoUrl:'',
                isActive:false,
                adminUsername: '',
                adminName: '',
                password: '',
                country: DEFAULT_COUNTRY,
                state: getCountryPreset(DEFAULT_COUNTRY)?.states[0] || '',
                currencyCode: getCountryPreset(DEFAULT_COUNTRY)?.currencyCode || 'USD',
                currencySymbol: getCountryPreset(DEFAULT_COUNTRY)?.currencySymbol || '\u20B9',
                taxName: getCountryPreset(DEFAULT_COUNTRY)?.taxName || 'Tax',
                taxRate: getCountryPreset(DEFAULT_COUNTRY)?.taxRate || 0,
        }
    }

    load() {
        this.service.getAll().subscribe({
            next: (res) => {
                this.restaurants = res;
                console.log(this.restaurants);
                this.loading = false;
                this.rdf.markForCheck();
            },
            error: (error) => {
                this.loading = false;
                this.notificationService.showApiError(error, 'Failed to load restaurants.');
            }
        });
    }

    edit(restaurant: any) {
        this.selectedRestaurant = { ...restaurant };
        this.onCountryChange(this.selectedRestaurant.country, false);
        this.isEditMode = true;
        this.dialogVisible = true;
    }
    openAddDialog(): void {
        this.dialogVisible = true;
        this.isEditMode = false;
        this.selectedRestaurant = this.getEmptyRestaurant();
        this.onCountryChange(this.selectedRestaurant.country, true);
    }
 
    // SAVE UPDATE
    save() {
        if (!this.isEditMode) {
            if (!this.selectedRestaurant.name.trim() || !this.selectedRestaurant.adminUsername.trim() || !this.selectedRestaurant.adminName.trim() || !this.selectedRestaurant.password.trim()) {
                this.notificationService.warn('Missing details', 'Please fill all required fields correctly.');
                return;
            }   
            
                this.service.create(this.selectedRestaurant).subscribe({
                    next: () => {
                    console.log(this.selectedRestaurant,"new");
                    this.notificationService.success('Restaurant created', 'The restaurant was created successfully.');
                    this.dialogVisible = false;
                    this.load();
                },
                error: (error) => {
                    this.notificationService.showApiError(error, 'Failed to create restaurant.');
                }
            });
        } else {
            this.service.update(this.selectedRestaurant.id, this.selectedRestaurant).subscribe({
                next: () => {
                    this.isEditMode = false;
                    this.dialogVisible = false;
                    this.load();
                    this.rdf.markForCheck();
                    this.notificationService.success('Restaurant updated', 'The restaurant was updated successfully.');
                },
                error: (error) => {
                    this.notificationService.showApiError(error, 'Failed to update restaurant.');
                }
            });
        }
    }

    delete(id: number) {
        console.log(id);
        this.service.delete(id).subscribe({
            next: () => {
                this.load();
                this.notificationService.success('Restaurant deleted', 'The restaurant was deleted successfully.');
            },
            error: (error) => {
                this.notificationService.showApiError(error, 'Failed to delete restaurant.');
            }
        });
    }
    getDecodedToken(): any {
        const token = localStorage.getItem('token');
        if (!token) return null;

        return jwtDecode(token);
    }
    getRole(): string | null {
        const decoded = this.getDecodedToken();
        this.rdf.markForCheck();
        this.userRole = decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decoded?.['unique_name'] || decoded?.name || null;
        return this.userRole;
    }

    onCountryChange(country: string, resetState = true): void {
        const preset = getCountryPreset(country);
        this.stateOptions = (preset?.states || []).map((state) => ({ label: state, value: state }));

        if (!preset) {
            return;
        }

        this.selectedRestaurant.currencyCode = preset.currencyCode;
        this.selectedRestaurant.currencySymbol = preset.currencySymbol;
        this.selectedRestaurant.taxName = preset.taxName;
        this.selectedRestaurant.taxRate = preset.taxRate;

        if (resetState || !preset.states.includes(this.selectedRestaurant.state)) {
            this.selectedRestaurant.state = preset.states[0] || '';
        }
    }
}
