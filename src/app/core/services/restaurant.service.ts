import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { Restaurants } from '@/app/features/super-admin/restaurants/restaurants';
import { observableToBeFn } from 'rxjs/internal/testing/TestScheduler';

@Injectable({ providedIn: 'root' })
export class RestaurantService {

  private apiUrl = `${environment.apiBaseUrl}/super-admin/restaurants`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  create(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }
  update(id:number,r:Restaurants):Observable<any>{
    return this.http.put(`${this.apiUrl}/${id}`,r);
  }
  delete(id:any):Observable<any>{

    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  getStats() {
  return this.http.get(`${this.apiUrl}/stats`);
}

}