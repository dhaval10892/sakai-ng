import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { MenuItem } from '@/app/core/models/menu-items.model';
import { Order } from '@/app/core/models/order.model';
import { ApiResponse } from '@/app/core/models/api-response.model';
import { PublicRestaurantSettings } from '@/app/core/models/public-restaurant-settings.model';
import { RestaurantTable } from '@/app/core/models/table.model';
import { BookingRequest } from '@/app/core/models/booking-request.model';
import { Restaurant } from '@/app/core/models/restaurant';
import { PublicRestaurantDiscovery } from '@/app/core/models/public-restaurant-discovery.model';
import { PublicMenuSearchItem } from '@/app/core/models/public-menu-search-item.model';

@Injectable({
    providedIn: 'root'
})
export class PublicOrderingService {
    private apiUrl = `${environment.apiBaseUrl}/public-ordering`;

    constructor(private http: HttpClient) {}

    getRestaurants(): Observable<Restaurant[]> {
        return this.http.get<Restaurant[]>(`${this.apiUrl}/restaurants`);
    }

    discoverRestaurants(query?: string, category?: string): Observable<PublicRestaurantDiscovery[]> {
        const params = new URLSearchParams();

        if (query?.trim()) {
            params.set('query', query.trim());
        }

        if (category?.trim()) {
            params.set('category', category.trim());
        }

        const queryString = params.toString();
        const url = queryString ? `${this.apiUrl}/discovery?${queryString}` : `${this.apiUrl}/discovery`;

        return this.http.get<PublicRestaurantDiscovery[]>(url);
    }

    searchMenuItems(query: string): Observable<PublicMenuSearchItem[]> {
        const params = new URLSearchParams();
        params.set('query', query.trim());

        return this.http.get<PublicMenuSearchItem[]>(`${this.apiUrl}/search-items?${params.toString()}`);
    }

    getMenuByTable(tableNumber: string): Observable<MenuItem[]> {
        return this.http.get<MenuItem[]>(`${this.apiUrl}/menu/${encodeURIComponent(tableNumber)}`);
    }

    getRestaurantSettings(tableNumber: string): Observable<PublicRestaurantSettings> {
        return this.http.get<PublicRestaurantSettings>(`${this.apiUrl}/settings/${encodeURIComponent(tableNumber)}`);
    }

    getRestaurantSettingsByRestaurant(restaurantId: number): Observable<PublicRestaurantSettings> {
        return this.http.get<PublicRestaurantSettings>(`${this.apiUrl}/restaurant/${restaurantId}/settings`);
    }

    getMenuByRestaurant(restaurantId: number): Observable<MenuItem[]> {
        return this.http.get<MenuItem[]>(`${this.apiUrl}/restaurant/${restaurantId}/menu`);
    }

    getTablesByRestaurant(restaurantId: number): Observable<RestaurantTable[]> {
        return this.http.get<RestaurantTable[]>(`${this.apiUrl}/restaurant/${restaurantId}/tables`);
    }

    createBookingRequest(request: Omit<BookingRequest, 'id' | 'status' | 'createdAt'>): Observable<BookingRequest> {
        return this.http.post<ApiResponse<BookingRequest> | BookingRequest>(`${this.apiUrl}/bookings`, request).pipe(
            map((response) => (response && typeof response === 'object' && 'data' in response ? response.data : response) as BookingRequest)
        );
    }

    createOrder(order: (Partial<Order> & { table: string }) & Record<string, unknown>): Observable<Order> {
        return this.http.post<ApiResponse<Order> | Order>(`${this.apiUrl}/orders`, order).pipe(
            map((response) => (response && typeof response === 'object' && 'data' in response ? response.data : response) as Order)
        );
    }
}
