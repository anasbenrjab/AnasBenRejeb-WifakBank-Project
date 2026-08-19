import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardData {
  username: string;
  welcomeMessage: string;
  totalApplications: number;
  activeSessions: number;
  lastLogin: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly API_URL = '/api';
  private http = inject(HttpClient);

  getData(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.API_URL}/dashboard/data`);
  }
}
