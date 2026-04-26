import { Injectable } from '@angular/core';
import { Order } from '../models/order.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@/environments/environment';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';


@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  private apiurl=`${environment.apiBaseUrl}/Order`;

  public constructor(private http:HttpClient){}

  getAllOrders(): Observable<Order[]> {
    const params = new HttpParams().set('_', Date.now().toString());

    return this.http.get<ApiResponse<Order[]> | Order[]>(this.apiurl, { params }).pipe(
      map((response) => this.unwrapResponse(response))
    );
  }
  addOrder(order:Order):Observable<Order>{
   return this.http.post<ApiResponse<Order> | Order>(this.apiurl,order).pipe(
    map((response) => this.unwrapResponse(response))
   );
  }
   getOrderById(id: number): Observable<Order> {
    const params = new HttpParams().set('_', Date.now().toString());

    return this.http.get<ApiResponse<Order> | Order>(`${this.apiurl}/${id}`, { params }).pipe(
      map((response) => this.unwrapResponse(response))
    );
  }
  updateOrder(order:Order):Observable<void>{
   return this.http.put<ApiResponse<null>>(`${this.apiurl}/${order.id}`,order).pipe(
    map(() => void 0)
   );
  }
  updateStatusFast(orderId:number,status:string):Observable<void>{
   return this.http.patch<ApiResponse<null>>(`${this.apiurl}/${orderId}/status`, { status }).pipe(
    map(() => void 0)
   );
  }
  updateStatus(order:Order,status:string):Observable<void>{
    
    const updateOrder:Order={
      ...order,
      status
    }
    console.log("OrderUpdatestatus",updateOrder);
    return this.updateOrder(updateOrder);
  }
  deleteOrder(id:number):Observable<void>{
  return  this.http.delete<void>(`${this.apiurl}/${id}`);
  }

  private unwrapResponse<T>(response: ApiResponse<T> | T): T {
    return this.isApiResponse(response) ? response.data : response;
  }

  private isApiResponse<T>(response: ApiResponse<T> | T): response is ApiResponse<T> {
    return !!response && typeof response === 'object' && 'data' in response;
  }
}
