import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { UserDto, DepartmentDto, SubDepartmentDto, RoleDto } from '../../../../core/models/auth.models';

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
  readonly roles = signal<RoleDto[]>([]);
  readonly user = signal<UserDto | null>(null);
  readonly selectedDepartmentId = signal<number | null>(null);

  editForm = this.fb.nonNullable.group({
    prenom: ['', [Validators.required]],
    nom: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    status: ['', [Validators.required]],
    departmentId: [null as number | null, []],
    subDepartmentId: [null as number | null, []],
    roleId: [null as number | null, [Validators.required]]
  });

  constructor() {
    // Load sub-departments when department changes
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
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.adminService.getDepartments().subscribe({
      next: deps => this.departments.set(deps),
      error: () => {}
    });

    this.adminService.getRoles().subscribe({
      next: roles => this.roles.set(roles),
      error: () => {}
    });

    this.adminService.getUser(id).subscribe({
      next: user => {
        this.user.set(user);
        this.editForm.patchValue({
          prenom: user.prenom,
          nom: user.nom,
          email: user.email,
          status: user.status,
          departmentId: user.department?.id ?? null,
          subDepartmentId: user.subDepartment?.id ?? null,
          roleId: user.roles && user.roles.length > 0 ? user.roles[0].id : null
        });
        if (user.department?.id) {
          this.selectedDepartmentId.set(user.department.id);
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
    // Reset sub-department when department changes
    this.editForm.patchValue({ subDepartmentId: null });
  }

  saveUser() {
    if (this.editForm.invalid) return;

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
}
