import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppEntry } from '../models/dashboard.models';
import { environment } from '../../../environments/environment';

const API_URL = `${environment.apiUrl}/api/dashboard`;

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getAuthorizedApps(): Observable<AppEntry[]> {
    return this.http.get<AppEntry[]>(`${API_URL}/applications`);
  }
}
