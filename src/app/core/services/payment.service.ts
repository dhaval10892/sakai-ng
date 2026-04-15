import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Payment } from '../models/payment.model';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/paged-result.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiBaseUrl}/Payments`;

  constructor(private http: HttpClient) {}

  getPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(this.apiUrl);
  }

  getPaymentById(id: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.apiUrl}/${id}`);
  }

  addPayment(payment: Payment): Observable<Payment> {
    return this.http.post<Payment>(this.apiUrl, payment);
  }

  updatePayment(payment: Payment): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${payment.id}`, payment);
  }

  deletePayment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  getPagedPayments(query: {
  paymentMethod?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  pageNumber?: number;
  pageSize?: number;
}) {
  let params = new HttpParams();

  if (query.paymentMethod) params = params.set('paymentMethod', query.paymentMethod);
  if (query.paymentStatus) params = params.set('paymentStatus', query.paymentStatus);
  if (query.startDate) params = params.set('startDate', query.startDate);
  if (query.endDate) params = params.set('endDate', query.endDate);
  if (query.pageNumber) params = params.set('pageNumber', query.pageNumber);
  if (query.pageSize) params = params.set('pageSize', query.pageSize);

  return this.http.get<PagedResult<Payment>>(`${this.apiUrl}/paged`, { params });
}
}