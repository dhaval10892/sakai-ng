import { Injectable } from '@angular/core';
import { MenuCategory } from '../models/menu-category.model';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay, tap } from 'rxjs';
import { environment } from '@/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class MenuCategoryService {
    private apiUrl = `${environment.apiBaseUrl}/MenuCategories`;
    private categoryRequest$?: Observable<MenuCategory[]>;
    private categorySnapshot: MenuCategory[] = [];

    constructor(private http: HttpClient) {}

    getCategories(forceRefresh = false): Observable<MenuCategory[]> {
        if (!this.categoryRequest$ || forceRefresh) {
            this.categoryRequest$ = this.http.get<MenuCategory[]>(this.apiUrl).pipe(
                tap((categories) => (this.categorySnapshot = [...categories])),
                shareReplay(1)
            );
        }

        return this.categoryRequest$;
    }
    createCategory(category: MenuCategory): Observable<MenuCategory> {
        return this.http.post<MenuCategory>(this.apiUrl, category).pipe(
            tap((createdCategory) => {
                this.setCategoryCache([...this.categorySnapshot, createdCategory]);
            })
        );
    }
    getById(id: number): Observable<MenuCategory> {
        return this.http.get<MenuCategory>(`${this.apiUrl}/${id}`);
    }
    update(id: number, category: MenuCategory): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, category).pipe(
            tap(() => {
                this.setCategoryCache(
                    this.categorySnapshot.map((item) => (item.id === id ? { ...item, ...category } : item))
                );
            })
        );
    }
    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => {
                this.setCategoryCache(this.categorySnapshot.filter((category) => category.id !== id));
            })
        );
    }

    private setCategoryCache(categories: MenuCategory[]): void {
        this.categorySnapshot = [...categories].sort((left, right) => left.name.localeCompare(right.name));
        this.categoryRequest$ = of(this.categorySnapshot);
    }
}
