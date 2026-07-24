import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { UserDto, DepartmentDto, ApplicationDto, RoleDto } from '../../../core/models/auth.models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);

  readonly users = signal<UserDto[]>([]);
  readonly departments = signal<DepartmentDto[]>([]);
  readonly applications = signal<ApplicationDto[]>([]);
  readonly roles = signal<RoleDto[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  // Filters
  readonly searchQuery = signal('');
  readonly statusFilter = signal<string>('all');
  readonly departmentFilter = signal<number | null>(null);

  // Computed filtered users
  readonly filteredUsers = computed(() => {
    let filtered = this.users();
    const query = this.searchQuery().toLowerCase();

    if (query) {
      filtered = filtered.filter(u =>
        u.login.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.prenom.toLowerCase().includes(query) ||
        u.nom.toLowerCase().includes(query)
      );
    }

    if (this.statusFilter() !== 'all') {
      filtered = filtered.filter(u => u.status === this.statusFilter());
    }

    if (this.departmentFilter() !== null) {
      filtered = filtered.filter(u => u.department?.id === this.departmentFilter());
    }

    return filtered;
  });

  readonly currentLogin = computed(() => this.authService.currentUser()?.login);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.adminService.getUsers().subscribe({
      next: users => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger les utilisateurs');
        this.loading.set(false);
      }
    });

    this.adminService.getDepartments().subscribe({
      next: depts => this.departments.set(depts),
      error: () => {}
    });

    this.adminService.getApplications().subscribe({
      next: apps => this.applications.set(apps),
      error: () => {}
    });

    this.adminService.getRoles().subscribe({
      next: roles => this.roles.set(roles),
      error: () => {}
    });
  }

  deleteUser(id: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) return;

    this.adminService.deleteUser(id).subscribe({
      next: () => this.loadData(),
      error: (err: any) => {
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la suppression de l’utilisateur');
      }
    });
  }

  getDepartmentName(dept?: DepartmentDto): string {
    return dept ? `${dept.code} - ${dept.name}` : 'Non assigné';
  }

  getStatusBadgeClass(status: string): string {
    return status === 'ACTIVE' ? 'badge badge-active' : 'badge badge-inactive';
  }

  parseNumber(value: string): number {
    return Number(value);
  }
}
