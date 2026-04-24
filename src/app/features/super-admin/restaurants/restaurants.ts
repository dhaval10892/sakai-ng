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

@Component({
    selector: 'app-restaurants',
    standalone: true,
    imports: [CommonModule, RouterModule, TableModule, ButtonDirective, ButtonModule, DialogModule, InputTextModule, FormsModule, PasswordDirective],
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
    
    constructor(
        private service: RestaurantService,
        private rdf: ChangeDetectorRef,
      
    ) {
        
    }
    ngOnInit() {
        this.load();
        this.getRole();
    }
    getEmptyRestaurant():any{
        return {
               
                name:'',
                logoUrl:'',
                isActive:false,
        }
    }

    load() {
        this.service.getAll().subscribe({
            next: (res) => {
                this.restaurants = res;
                console.log(this.restaurants);
                this.loading = false;
                this.rdf.detectChanges();
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    edit(restaurant: any) {
        this.selectedRestaurant = { ...restaurant };
        this.isEditMode = true;
        this.dialogVisible = true;
    }
    openAddDialog(): void {
        this.dialogVisible = true;
        this.isEditMode = false;
        this.selectedRestaurant = this.getEmptyRestaurant();
    }
 
    // SAVE UPDATE
    save() {
        if (!this.isEditMode) {
            if (!this.selectedRestaurant.name.trim()||!this.selectedRestaurant.AdminUsername.trim()) {
                alert('Please fill all required fields correctly.');
                return;
            }   
            
                this.service.create(this.selectedRestaurant).subscribe(() => {
                    console.log(this.selectedRestaurant,"new");
                    alert('Restaurant created!');
                    this.dialogVisible = false;
                    this.load();
                });
        } else {
            this.service.update(this.selectedRestaurant.id, this.selectedRestaurant).subscribe(() => {
                this.isEditMode = false;
                this.dialogVisible = false;
                this.load();
                this.rdf.detectChanges();
            });
        }
    }

    delete(id: number) {
        console.log(id);
        if (!confirm('Delete this restaurant?')) return;

        this.service.delete(id).subscribe(() => {
            this.load();
        });
    }
    getDecodedToken(): any {
        const token = localStorage.getItem('token');
        if (!token) return null;

        return jwtDecode(token);
    }
    getRole(): string | null {
        const decoded = this.getDecodedToken();
        this.rdf.detectChanges();
        this.userRole = decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decoded?.['unique_name'] || decoded?.name || null;
        return this.userRole;
    }
}
