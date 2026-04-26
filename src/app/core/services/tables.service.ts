import { Injectable } from '@angular/core';
import { RestaurantTable } from '../models/table.model';
import { environment } from '@/environments/environment';
import { map, Observable, switchMap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class TablesService {
  private apiurl = `${environment.apiBaseUrl}/Table`;

  constructor(private http: HttpClient) {}

  getAllTables(): Observable<RestaurantTable[]> {
    return this.http.get<RestaurantTable[]>(this.apiurl);
  }

  addTable(table: RestaurantTable): Observable<RestaurantTable> {
    return this.http.post<RestaurantTable>(this.apiurl, table);
  }

  getTableById(id: number): Observable<RestaurantTable> {
    return this.http.get<RestaurantTable>(`${this.apiurl}/${id}`);
  }

  updateTable(table: RestaurantTable): Observable<void> {
    return this.http.put<ApiResponse<null>>(`${this.apiurl}/${table.id}`, table).pipe(
      map(() => void 0)
    );
  }

  deleteTable(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiurl}/${id}`);
  }

  getTableByNumber(tableNumber: string): Observable<RestaurantTable | undefined> {
    return this.getAllTables().pipe(
      map((tables) =>
        tables.find(
          (table) =>
            table.number.trim().toLowerCase() === tableNumber.trim().toLowerCase()
        )
      )
    );
  }

  updateTableStatus(tableNumber: string, status: string): Observable<void> {
    return this.getTableByNumber(tableNumber).pipe(
      switchMap((table) => {
        if (!table) {
          return throwError(() => new Error('Table not found'));
        }

        const updatedTable: RestaurantTable = {
          ...table,
          status
        };

        return this.updateTable(updatedTable);
      })
    );
  }
}
