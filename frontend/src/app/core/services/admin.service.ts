import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserDto, DepartmentDto, ApplicationDto, RoleDto } from '../models/auth.models';
import { environment } from '../../../environments/environment';

const API_URL = `${environment.apiUrl}/api/admin`;

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  // Users
  getUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${API_URL}/users`);
  }

  getUser(id: number): Observable<UserDto> {
    return this.http.get<UserDto>(`${API_URL}/users/${id}`);
  }

  updateUser(id: number, user: Partial<UserDto>): Observable<UserDto> {
    return this.http.put<UserDto>(`${API_URL}/users/${id}`, user);
  }

  createUser(user: Partial<UserDto>): Observable<UserDto> {
    return this.http.post<UserDto>(`${API_URL}/users`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/users/${id}`);
  }

  assignRoleToUser(userId: number, roleId: number): Observable<UserDto> {
    return this.http.post<UserDto>(`${API_URL}/users/${userId}/roles/${roleId}`, {});
  }

  revokeRoleFromUser(userId: number, roleId: number): Observable<UserDto> {
    return this.http.delete<UserDto>(`${API_URL}/users/${userId}/roles/${roleId}`);
  }

  // Departments
  getDepartments(): Observable<DepartmentDto[]> {
    return this.http.get<DepartmentDto[]>(`${API_URL}/departments`);
  }

  getDepartment(id: number): Observable<DepartmentDto> {
    return this.http.get<DepartmentDto>(`${API_URL}/departments/${id}`);
  }

  createDepartment(dept: Partial<DepartmentDto>): Observable<DepartmentDto> {
    return this.http.post<DepartmentDto>(`${API_URL}/departments`, dept);
  }

  updateDepartment(id: number, dept: Partial<DepartmentDto>): Observable<DepartmentDto> {
    return this.http.put<DepartmentDto>(`${API_URL}/departments/${id}`, dept);
  }

  deleteDepartment(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/departments/${id}`);
  }

  // Roles
  getRoles(): Observable<RoleDto[]> {
    return this.http.get<RoleDto[]>(`${API_URL}/roles`);
  }

  getRole(id: number): Observable<RoleDto> {
    return this.http.get<RoleDto>(`${API_URL}/roles/${id}`);
  }

  createRole(role: Partial<RoleDto>): Observable<RoleDto> {
    return this.http.post<RoleDto>(`${API_URL}/roles`, role);
  }

  updateRole(id: number, role: Partial<RoleDto>): Observable<RoleDto> {
    return this.http.put<RoleDto>(`${API_URL}/roles/${id}`, role);
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/roles/${id}`);
  }

  // Applications
  getApplications(): Observable<ApplicationDto[]> {
    return this.http.get<ApplicationDto[]>(`${API_URL}/applications`);
  }

  getApplication(id: number): Observable<ApplicationDto> {
    return this.http.get<ApplicationDto>(`${API_URL}/applications/${id}`);
  }

  createApplication(application: Partial<ApplicationDto>): Observable<ApplicationDto> {
    return this.http.post<ApplicationDto>(`${API_URL}/applications`, application);
  }

  updateApplication(id: number, application: Partial<ApplicationDto>): Observable<ApplicationDto> {
    return this.http.put<ApplicationDto>(`${API_URL}/applications/${id}`, application);
  }

  deleteApplication(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/applications/${id}`);
  }
}
