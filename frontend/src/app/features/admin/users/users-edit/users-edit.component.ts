import { Component, inject, signal, OnInit, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { UserDto, DepartmentDto, SubDepartmentDto, RoleDto, ApplicationDto, ApplicationRoleDto, UserApplicationRoleDto } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-users-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users-edit.component.html',
  styleUrl: './users-edit.component.css'
})
export class UsersEditComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly departments = signal<DepartmentDto[]>([]);
  readonly subDepartments = signal<SubDepartmentDto[]>([]);
  readonly applications = signal<ApplicationDto[]>([]);
  readonly roles = signal<RoleDto[]>([]);
  readonly applicationRoles = signal<ApplicationRoleDto[]>([]);
  readonly user = signal<UserDto | null>(null);
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

  editForm = this.fb.nonNullable.group({
    prenom: ['', [Validators.required]],
    nom: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    status: ['', [Validators.required]],
    departmentId: [null as number | null, []],
    subDepartmentId: [null as number | null, []],
    applicationId: [null as number | null, [Validators.required]],
    roleId: [null as number | null, [Validators.required]]
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
      const currentRoleId = this.editForm.value.roleId;
      if (appId && currentRoleId != null) {
        const stillValid = this.filteredRoles().some(r => r.id === currentRoleId);
        if (!stillValid) {
          this.editForm.patchValue({ roleId: null });
        }
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

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

    this.adminService.getUser(id).subscribe({
      next: user => {
        this.user.set(user);
        const existingAssignments: UserApplicationRoleDto[] = user.applicationRoles ?? [];
        const primaryAssignment = existingAssignments[0] ?? null;
        this.editForm.patchValue({
          prenom: user.prenom,
          nom: user.nom,
          email: user.email,
          status: user.status,
          departmentId: user.department?.id ?? null,
          subDepartmentId: user.subDepartment?.id ?? null,
          applicationId: primaryAssignment?.applicationId ?? null,
          roleId: primaryAssignment?.roleId ?? null
        });
        if (user.department?.id) {
          this.selectedDepartmentId.set(user.department.id);
        }
        if (primaryAssignment?.applicationId) {
          this.selectedApplicationId.set(primaryAssignment.applicationId);
        }
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Erreur lors du chargement de l’utilisateur');
        this.loading.set(false);
      }
    });
  }

  onDepartmentChange() {
    const deptId = this.editForm.value.departmentId ?? null;
    this.selectedDepartmentId.set(deptId);
    this.editForm.patchValue({ subDepartmentId: null });
  }

  onApplicationChange() {
    const appId = this.editForm.value.applicationId ?? null;
    this.selectedApplicationId.set(appId);
    this.editForm.patchValue({ roleId: null });
  }

  pickExistingAssignment(appRole: UserApplicationRoleDto) {
    this.editForm.patchValue({
      applicationId: appRole.applicationId,
      roleId: appRole.roleId
    });
    this.selectedApplicationId.set(appRole.applicationId);
  }

  saveUser() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const id = Number(this.route.snapshot.paramMap.get('id'));
    const formValue = this.editForm.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);

    const updateData: Partial<UserDto> & { subDepartmentId?: number | null } = {
      prenom: formValue.prenom,
      nom: formValue.nom,
      email: formValue.email,
      status: formValue.status || 'ACTIF',
      department: formValue.departmentId
        ? this.departments().find(d => d.id === formValue.departmentId)
        : null,
      subDepartmentId: formValue.subDepartmentId,
      applicationId: formValue.applicationId,
      roleId: formValue.roleId
    };

    this.adminService.updateUser(id, updateData as Partial<UserDto>).subscribe({
      next: () => this.router.navigate(['/admin/users']),
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la mise à jour de l’utilisateur');
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

  getOtherAssignmentsCount(): number {
    const u = this.user();
    if (!u || !u.applicationRoles) return 0;
    return Math.max(0, u.applicationRoles.length - 1);
  }
}
