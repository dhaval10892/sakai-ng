import { Injectable } from '@angular/core';
import { MenuItem } from '../../core/models/menu-items.model';
import { HttpClient } from '@angular/common/http';

import { environment } from '@/environments/environment';
import { Observable, of, shareReplay, tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MenuService {
    private apiurl = `${environment.apiBaseUrl}/Menu`;
    private menuItemsRequest$?: Observable<MenuItem[]>;
    private menuItemsSnapshot: MenuItem[] = [];

    constructor(private http: HttpClient) {}

    getAllMenuItems(forceRefresh = false): Observable<MenuItem[]> {
        if (!this.menuItemsRequest$ || forceRefresh) {
            this.menuItemsRequest$ = this.http.get<MenuItem[]>(this.apiurl).pipe(
                tap((items) => (this.menuItemsSnapshot = [...items])),
                shareReplay(1)
            );
        }

        return this.menuItemsRequest$;
    }
    addMenuItems(item: MenuItem): Observable<MenuItem> {
        return this.http.post<MenuItem>(this.apiurl, item).pipe(
            tap((createdItem) => {
                this.setMenuCache([...this.menuItemsSnapshot, createdItem]);
            })
        );
    }
    updateMenuItem(updatedItem: MenuItem): Observable<void> {
        return this.http.put<void>(`${this.apiurl}/${updatedItem.id}`, updatedItem).pipe(
            tap(() => {
                this.setMenuCache(
                    this.menuItemsSnapshot.map((item) => (item.id === updatedItem.id ? { ...updatedItem } : item))
                );
            })
        );
    }
    deleteMenuItem(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiurl}/${id}`).pipe(
            tap(() => {
                this.setMenuCache(this.menuItemsSnapshot.filter((item) => item.id !== id));
            })
        );
    }
    uploadImage(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<{ imageUrl: string }>(`${this.apiurl}/upload`, formData);
    }

    private setMenuCache(items: MenuItem[]): void {
        this.menuItemsSnapshot = [...items].sort((left, right) => left.name.localeCompare(right.name));
        this.menuItemsRequest$ = of(this.menuItemsSnapshot);
    }
}
