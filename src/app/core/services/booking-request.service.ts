import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';
import { BookingRequest } from '@/app/core/models/booking-request.model';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class BookingRequestService {
    private apiUrl = `${environment.apiBaseUrl}/BookingRequests`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<BookingRequest[]> {
        return this.http.get<BookingRequest[]>(this.apiUrl);
    }

    updateStatus(id: number, status: string): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}/status`, { status });
    }
}
