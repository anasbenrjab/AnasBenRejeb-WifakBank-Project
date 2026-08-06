import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { UserDto, DepartmentDto, SubDepartmentDto, UserApplicationRoleDto, RoleDto } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-users-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './users-detail.component.html',
  styleUrl: './users-detail.component.css'
})
export class UsersDetailComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly user = signal<UserDto | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id)) {
      this.errorMessage.set('Identifiant utilisateur invalide');
      this.loading.set(false);
      return;
    }

    this.adminService.getUser(id).subscribe({
      next: u => {
        this.user.set(u);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Erreur lors du chargement de l’utilisateur');
        this.loading.set(false);
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    return status === 'ACTIF' ? 'badge badge-active' : 'badge badge-inactive';
  }

  getAuthTypeLabel(authType: string): string {
    switch (authType) {
      case 'AD': return 'Active Directory';
      case 'LOCAL': return 'Local Wifak';
      default: return authType;
    }
  }

  getDepartmentName(dept?: DepartmentDto | null): string {
    return dept ? `${dept.code} - ${dept.name}` : 'Non assigné';
  }

  getSubDepartmentName(subDept?: SubDepartmentDto | null): string {
    return subDept ? subDept.name : 'Non assigné';
  }

  getRoleName(roles?: RoleDto[]): string {
    if (!roles || roles.length === 0) return 'Non assigné';
    return roles.map(r => r.nom).join(', ');
  }

  formatDateTime(value?: string | null): string {
    if (!value) return '—';
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return value;
      return d.toLocaleString('fr-FR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return value;
    }
  }

  back(): void {
    this.router.navigate(['/admin/users']);
  }
}
