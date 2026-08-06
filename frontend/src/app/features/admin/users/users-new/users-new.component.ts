import { Component, inject, signal, effect, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { UserDto, DepartmentDto, SubDepartmentDto, RoleDto, ApplicationDto, ApplicationRoleDto } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-users-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users-new.component.html',
  styleUrl: './users-new.component.css'
})
export class UsersNewComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly departments = signal<DepartmentDto[]>([]);
  readonly subDepartments = signal<SubDepartmentDto[]>([]);
  readonly applications = signal<ApplicationDto[]>([]);
  readonly roles = signal<RoleDto[]>([]);
  readonly applicationRoles = signal<ApplicationRoleDto[]>([]);
  readonly selectedDepartmentId = signal<number | null>(null);
  readonly selectedApplicationId = signal<number | null>(null);

  readonly filteredRoles = computed(() => {
    const appId = this.selectedApplicationId();
    const allRoles = this.roles();
    const appRoles = this.applicationRoles();
    if (!appId) return allRoles;
    const allowedRoleIds = new Set(
      appRoles.filter(ar => ar.applicationId === appId).map(ar => ar.roleId)
    );
    return allRoles.filter(r => allowedRoleIds.has(r.id));
  });

  createForm = this.fb.nonNullable.group({
    login: ['', [Validators.required]],
    prenom: ['', [Validators.required]],
    nom: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    authType: ['AD', [Validators.required]],
    status: ['ACTIF', [Validators.required]],
    password: ['', []],
    applicationId: [null as number | null, [Validators.required]],
    roleId: [null as number | null, [Validators.required]],
    departmentId: [null as number | null, []],
    subDepartmentId: [null as number | null, []]
  });

  constructor() {
    effect(() => {
      const deptId = this.selectedDepartmentId();
      if (deptId) {
        this.adminService.getSubDepartmentsByDepartment(deptId).subscribe({
          next: subDepts => this.subDepartments.set(subDepts),
          error: () => this.subDepartments.set([])
        });
      } else {
        this.subDepartments.set([]);
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const appId = this.selectedApplicationId();
      const currentRoleId = this.createForm.value.roleId;
      if (appId && currentRoleId != null) {
        const stillValid = this.filteredRoles().some(r => r.id === currentRoleId);
        if (!stillValid) {
          this.createForm.patchValue({ roleId: null });
        }
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.adminService.getDepartments().subscribe({
      next: deps => this.departments.set(deps),
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

    this.adminService.getApplicationRoles().subscribe({
      next: ars => this.applicationRoles.set(ars),
      error: () => {}
    });
  }

  onDepartmentChange() {
    const deptId = this.createForm.value.departmentId ?? null;
    this.selectedDepartmentId.set(deptId);
    this.createForm.patchValue({ subDepartmentId: null });
  }

  onApplicationChange() {
    const appId = this.createForm.value.applicationId ?? null;
    this.selectedApplicationId.set(appId);
    this.createForm.patchValue({ roleId: null });
  }

  saveCreate() {
    if (this.createForm.invalid) return;

    const formValue = this.createForm.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);

    const createData: Partial<UserDto> & { subDepartmentId?: number | null } = {
      login: formValue.login,
      prenom: formValue.prenom,
      nom: formValue.nom,
      email: formValue.email,
      authType: formValue.authType,
      status: formValue.status || 'ACTIF',
      applicationId: formValue.applicationId,
      roleId: formValue.roleId,
      department: formValue.departmentId
        ? this.departments().find(d => d.id === formValue.departmentId)
        : null,
      subDepartmentId: formValue.subDepartmentId,
      password: formValue.authType === 'LOCAL' ? formValue.password : undefined
    };

    this.adminService.createUser(createData as UserDto).subscribe({
      next: () => this.router.navigate(['/admin/users']),
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la création de l’utilisateur');
        this.loading.set(false);
      }
    });
  }

  cancel() {
    this.router.navigate(['/admin/users']);
  }

  getDepartmentName(dept?: DepartmentDto) {
    return dept ? `${dept.code} - ${dept.name}` : 'Non assigné';
  }
}
