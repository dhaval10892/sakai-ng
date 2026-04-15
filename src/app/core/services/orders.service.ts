import { Injectable } from '@angular/core';
import { Order } from '../models/order.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  private apiurl=`${environment.apiBaseUrl}/Order`;

  public constructor(private http:HttpClient){}

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiurl);
  }
  addOrder(order:Order):Observable<Order>{
   return this.http.post<Order>(this.apiurl,order);
  }
   getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiurl}/${id}`);
  }
  updateOrder(order:Order):Observable<void>{
   return this.http.put<void>(`${this.apiurl}/${order.id}`,order);
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
}