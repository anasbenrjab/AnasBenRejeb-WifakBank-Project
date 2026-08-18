import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import {
  UserDto, DepartmentDto, SubDepartmentDto,
  UserApplicationRoleDto, RoleDto, ApplicationDto, ApplicationRoleDto
} from '../../../../core/models/auth.models';

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

  // Reference data for the "add assignment" picker
  readonly applications = signal<ApplicationDto[]>([]);
  readonly roles = signal<RoleDto[]>([]);
  readonly applicationRoles = signal<ApplicationRoleDto[]>([]);

  // "Add assignment" picker state
  readonly addAppId = signal<number | null>(null);
  readonly addRoleId = signal<number | null>(null);
  readonly adding = signal(false);
  readonly roleActionError = signal<string | null>(null);

  /** Roles filtered to the selected application's whitelist. */
  readonly filteredAddRoles = computed(() => {
    const appId = this.addAppId();
    const allRoles = this.roles();
    const appRoles = this.applicationRoles();
    if (!appId) return [];
    const allowed = new Set(
      appRoles.filter(ar => ar.applicationId === appId).map(ar => ar.roleId)
    );
    return allRoles.filter(r => allowed.has(r.id));
  });

  private get userId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    if (!this.userId || isNaN(this.userId)) {
      this.errorMessage.set('Identifiant utilisateur invalide');
      this.loading.set(false);
      return;
    }

    // Load user and reference data in parallel
    this.adminService.getUser(this.userId).subscribe({
      next: u => { this.user.set(u); this.loading.set(false); },
      error: () => {
        this.errorMessage.set('Erreur lors du chargement de l\'utilisateur');
        this.loading.set(false);
      }
    });

    this.adminService.getApplications().subscribe({
      next: apps => this.applications.set(apps),
      error: () => {}
    });
    this.adminService.getRoles().subscribe({
      next: roles => this.roles.set(roles),
      error: () => {}
    });
    this.adminService.getApplicationRoles().subscribe({
      next: ars => this.applicationRoles.set(ars),
      error: () => {}
    });
  }

  // ── Assignment management ─────────────────────────────────────────────────

  onAddAppChange(event: Event): void {
    const appId = Number((event.target as HTMLSelectElement).value) || null;
    this.addAppId.set(appId);
    this.addRoleId.set(null); // reset role when app changes
  }

  onAddRoleChange(event: Event): void {
    const roleId = Number((event.target as HTMLSelectElement).value) || null;
    this.addRoleId.set(roleId);
  }

  addAssignment(): void {
    const appId = this.addAppId();
    const roleId = this.addRoleId();
    if (!appId || !roleId) return;

    this.adding.set(true);
    this.roleActionError.set(null);

    this.adminService.assignRoleToUser(this.userId, appId, roleId).subscribe({
      next: () => {
        this.addAppId.set(null);
        this.addRoleId.set(null);
        this.reloadUser();
        this.adding.set(false);
      },
      error: (err) => {
        this.roleActionError.set(err?.error?.message || 'Erreur lors de l\'ajout de l\'affectation.');
        this.adding.set(false);
      }
    });
  }

  removeAssignment(applicationId: number, roleId: number): void {
    this.roleActionError.set(null);
    this.adminService.revokeRoleFromUser(this.userId, applicationId, roleId).subscribe({
      next: () => this.reloadUser(),
      error: (err) => {
        this.roleActionError.set(err?.error?.message || 'Erreur lors du retrait de l\'affectation.');
      }
    });
  }

  /** Reloads user from the server — always reflects true DB state after add/remove. */
  private reloadUser(): void {
    this.adminService.getUser(this.userId).subscribe({
      next: u => this.user.set(u),
      error: () => this.roleActionError.set('Erreur lors du rechargement des données.')
    });
  }

  // ── Display helpers ───────────────────────────────────────────────────────

  getStatusBadgeClass(status: string): string {
    return status === 'ACTIF' ? 'badge badge-active' : 'badge badge-inactive';
  }

  getAuthTypeLabel(authType: string): string {
    switch (authType) {
      case 'AD':    return 'Active Directory';
      case 'LOCAL': return 'Local Wifak';
      default:      return authType;
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
    } catch { return value; }
  }

  back(): void {
    this.router.navigate(['/admin/users']);
  }
}
