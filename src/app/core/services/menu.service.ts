import { Injectable } from '@angular/core';
import { MenuItem } from '../../core/models/menu-items.model';
import { HttpClient } from '@angular/common/http';

import { environment } from '@/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MenuService {
    private menuItems: MenuItem[] = [];
    private apiurl = `${environment.apiBaseUrl}/Menu`;
    private constructor(private http: HttpClient) {}

    getAllMenuItems(): Observable<MenuItem[]> {
        return this.http.get<MenuItem[]>(this.apiurl);
    }
    addMenuItems(item: MenuItem): Observable<MenuItem> {
        console.log(item.categoryName, 'service calling');
        return this.http.post<MenuItem>(this.apiurl, item);
    }
    updateMenuItem(updatedItem: MenuItem): Observable<void> {
        return this.http.put<void>(`${this.apiurl}/${updatedItem.id}`, updatedItem);
    }
    deleteMenuItem(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiurl}/${id}`);
    }
    uploadImage(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<{ imageUrl: string }>(`${this.apiurl}/upload`, formData);
    }
}
