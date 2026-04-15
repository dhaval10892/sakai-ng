import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AppUser } from '../models/user.model';
import { CreateUser } from '../models/create-user.model';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private apiUrl = `${environment.apiBaseUrl}/Users`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<AppUser[]> {
    return this.http.get<AppUser[]>(this.apiUrl);
  }

  createUser(user: CreateUser): Observable<AppUser> {
    return this.http.post<AppUser>(this.apiUrl, user);
  }

  updateRole(id: string, role: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/role`, { role });
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  changePassword(payload: { currentPassword: string; newPassword: string }) {
  return this.http.put<void>(`${this.apiUrl}/change-password`, payload);
}

resetPassword(id: string, payload: { newPassword: string }) {
  return this.http.put<void>(`${this.apiUrl}/${id}/reset-password`, payload);
}
updateStatus(id: string, isActive: boolean) {
  return this.http.put<void>(`${this.apiUrl}/${id}/status`, { isActive });
}

}