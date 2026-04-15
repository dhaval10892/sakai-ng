import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ActivityLog } from '../models/activity-log.model';
import { PagedResult } from '../models/paged-result.model';

@Injectable({
  providedIn: 'root'
})
export class ActivityLogService {
  private apiUrl = `${environment.apiBaseUrl}/ActivityLogs`;

  constructor(private http: HttpClient) {}

  getLogs(query: {
    action?: string;
    entityName?: string;
    performedBy?: string;
    startDate?: string;
    endDate?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Observable<PagedResult<ActivityLog>> {
    let params = new HttpParams();

    if (query.action) params = params.set('action', query.action);
    if (query.entityName) params = params.set('entityName', query.entityName);
    if (query.performedBy) params = params.set('performedBy', query.performedBy);
    if (query.startDate) params = params.set('startDate', query.startDate);
    if (query.endDate) params = params.set('endDate', query.endDate);
    if (query.pageNumber) params = params.set('pageNumber', query.pageNumber);
    if (query.pageSize) params = params.set('pageSize', query.pageSize);

    return this.http.get<PagedResult<ActivityLog>>(this.apiUrl, { params });
  }
}