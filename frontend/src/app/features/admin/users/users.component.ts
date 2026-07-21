import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserDto, DepartmentDto, ApplicationDto, RoleDto } from '../../../core/models/auth.models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly users = signal<UserDto[]>([]);
  readonly departments = signal<DepartmentDto[]>([]);
  readonly applications = signal<ApplicationDto[]>([]);
  readonly roles = signal<RoleDto[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly editingUserId = signal<number | null>(null);
  readonly assigningRoleUserId = signal<number | null>(null);
  readonly selectedApplicationId = signal<number | null>(null);
  readonly showCreateForm = signal(false);
  
  readonly currentLogin = computed(() => this.authService.currentUser()?.login);

  editForm = this.fb.nonNullable.group({
    nom: ['', [Validators.required]],
    prenom: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    status: ['', [Validators.required]],
    departmentId: [null as number | null]
  });

  createForm = this.fb.nonNullable.group({
    login: ['', [Validators.required]],
    nom: ['', [Validators.required]],
    prenom: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    authType: ['AD', [Validators.required]],
    status: ['ACTIVE', [Validators.required]],
    password: ['', []],
    departmentId: [null as number | null]
  });

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

  startEdit(user: UserDto): void {
    this.editingUserId.set(user.id);
    this.editForm.patchValue({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      status: user.status,
      departmentId: user.department?.id ?? null
    });
  }

  startCreate(): void {
    this.showCreateForm.set(true);
    this.createForm.reset();
    this.createForm.patchValue({
      authType: 'AD',
      status: 'ACTIVE'
    });
  }

  cancelCreate(): void {
    this.showCreateForm.set(false);
    this.createForm.reset();
  }

  saveCreate(): void {
    if (this.createForm.invalid) return;
    const formValue = this.createForm.getRawValue();

    const createData: UserDto = {
      id: 0,
      login: formValue.login,
      nom: formValue.nom,
      prenom: formValue.prenom,
      email: formValue.email,
      authType: formValue.authType,
      status: formValue.status,
      department: formValue.departmentId 
        ? this.departments().find(d => d.id === formValue.departmentId) 
        : undefined,
      password: formValue.authType === 'LOCAL' ? formValue.password : undefined
    };

    this.adminService.createUser(createData).subscribe({
      next: () => {
        this.cancelCreate();
        this.loadData();
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la création de l\'utilisateur');
      }
    });
  }

  cancelEdit(): void {
    this.editingUserId.set(null);
    this.editForm.reset();
  }

  saveUser(): void {
    if (this.editForm.invalid) return;

    const id = this.editingUserId()!;
    const formValue = this.editForm.getRawValue();
    
    const updateData: Partial<UserDto> = {
      nom: formValue.nom,
      prenom: formValue.prenom,
      email: formValue.email,
      status: formValue.status,
      department: formValue.departmentId 
        ? this.departments().find(d => d.id === formValue.departmentId) 
        : undefined
    };

    this.adminService.updateUser(id, updateData).subscribe({
      next: () => {
        this.cancelEdit();
        this.loadData();
      },
      error: () => {
        this.errorMessage.set('Erreur lors de la mise à jour de l\'utilisateur');
      }
    });
  }

  startAssignRole(user: UserDto): void {
    this.assigningRoleUserId.set(user.id);
    this.selectedApplicationId.set(null);
  }

  cancelAssignRole(): void {
    this.assigningRoleUserId.set(null);
    this.selectedApplicationId.set(null);
  }

  assignRole(roleId: number): void {
    const userId = this.assigningRoleUserId()!;
    this.adminService.assignRoleToUser(userId, roleId).subscribe({
      next: () => {
        this.cancelAssignRole();
        this.loadData();
      },
      error: () => {
        this.errorMessage.set('Erreur lors de l\'assignation du rôle');
      }
    });
  }

  revokeRole(userId: number, roleId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir révoquer ce rôle?')) return;

    this.adminService.revokeRoleFromUser(userId, roleId).subscribe({
      next: () => {
        this.loadData();
      },
      error: () => {
        this.errorMessage.set('Erreur lors de la révocation du rôle');
      }
    });
  }

  getDepartmentName(dept?: DepartmentDto): string {
    return dept ? `${dept.code} - ${dept.name}` : 'Non assigné';
  }

  getStatusBadgeClass(status: string): string {
    return status === 'ACTIVE' ? 'badge badge-active' : 'badge badge-inactive';
  }

  getRolesByApplication(user: UserDto): { app: ApplicationDto, roles: RoleDto[] }[] {
    const appRoles = new Map<number, { app: ApplicationDto, roles: RoleDto[] }>();
    for (const app of this.applications()) {
      appRoles.set(app.id, { app, roles: [] });
    }
    if (user.roles) {
      for (const role of user.roles) {
        const entry = appRoles.get(role.application.id);
        if (entry) {
          entry.roles.push(role);
        }
      }
    }
    return Array.from(appRoles.values()).filter(entry => entry.roles.length > 0);
  }

  getAvailableRolesForApplication(appId: number, user: UserDto): RoleDto[] {
    const userRoleIds = new Set(user.roles?.map(r => r.id) || []);
    return this.roles().filter(r => r.application.id === appId && !userRoleIds.has(r.id));
  }

  deleteUser(id: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) return;

    this.adminService.deleteUser(id).subscribe({
      next: () => this.loadData(),
      error: (err: any) => {
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la suppression de l\'utilisateur');
      }
    });
  }
}
