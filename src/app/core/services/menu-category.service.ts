import { Injectable } from '@angular/core';
import { MenuCategory } from '../models/menu-category.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class MenuCategoryService {
    private apiUrl = `${environment.apiBaseUrl}/MenuCategories`;

    constructor(private http: HttpClient) {}

    getCategories(): Observable<MenuCategory[]> {
        return this.http.get<MenuCategory[]>(this.apiUrl);
    }
    createCategory(category: MenuCategory): Observable<MenuCategory> {
        return this.http.post<MenuCategory>(this.apiUrl, category);
    }
    getById(id: number): Observable<MenuCategory> {
        return this.http.get<MenuCategory>(`${this.apiUrl}/${id}`);
    }
    update(id: number, category: MenuCategory): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, category);
    }
    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
