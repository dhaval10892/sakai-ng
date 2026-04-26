import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { Restaurant } from '@/app/core/models/restaurant';

@Injectable({ providedIn: 'root' })
export class RestaurantService {

  private apiUrl = `${environment.apiBaseUrl}/super-admin/restaurants`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(this.apiUrl);
  }

  create(data: Partial<Restaurant> & Record<string, unknown>): Observable<Restaurant> {
    return this.http.post<Restaurant>(this.apiUrl, data);
  }
  update(id:number,r:Partial<Restaurant>):Observable<void>{
    return this.http.put<void>(`${this.apiUrl}/${id}`,r);
  }
  delete(id:number):Observable<void>{

    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  getStats(): Observable<unknown> {
  return this.http.get(`${this.apiUrl}/stats`);
}

}
