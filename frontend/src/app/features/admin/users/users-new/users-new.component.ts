import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import {
  UserDto, DepartmentDto, SubDepartmentDto,
  RoleDto, ApplicationDto, ApplicationRoleDto
} from '../../../../core/models/auth.models';

/** One application+role picker row in the assignment list. */
interface AssignmentRow {
  appId: number | null;
  roleId: number | null;
}

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

  // Dynamic assignment rows — start with one empty row
  readonly assignmentRows = signal<AssignmentRow[]>([{ appId: null, roleId: null }]);

  /** Filtered roles per row, keyed by row index. */
  readonly filteredRolesPerRow = computed(() => {
    const allRoles = this.roles();
    const appRoles = this.applicationRoles();
    return this.assignmentRows().map(row => {
      if (!row.appId) return allRoles;
      const allowed = new Set(
        appRoles.filter(ar => ar.applicationId === row.appId).map(ar => ar.roleId)
      );
      return allRoles.filter(r => allowed.has(r.id));
    });
  });

  createForm = this.fb.nonNullable.group({
    login:        ['', [Validators.required]],
    prenom:       ['', [Validators.required]],
    nom:          ['', [Validators.required]],
    email:        ['', [Validators.required, Validators.email]],
    authType:     ['AD', [Validators.required]],
    status:       ['ACTIF', [Validators.required]],
    password:     ['', []],
    departmentId: [null as number | null, []],
    subDepartmentId: [null as number | null, []]
  });

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

  // ── Assignment row management ─────────────────────────────────────────────

  onRowAppChange(index: number, event: Event): void {
    const appId = Number((event.target as HTMLSelectElement).value) || null;
    const rows = [...this.assignmentRows()];
    rows[index] = { appId, roleId: null }; // reset role when app changes
    this.assignmentRows.set(rows);
  }

  onRowRoleChange(index: number, event: Event): void {
    const roleId = Number((event.target as HTMLSelectElement).value) || null;
    const rows = [...this.assignmentRows()];
    rows[index] = { ...rows[index], roleId };
    this.assignmentRows.set(rows);
  }

  addRow(): void {
    this.assignmentRows.set([...this.assignmentRows(), { appId: null, roleId: null }]);
  }

  removeRow(index: number): void {
    const rows = this.assignmentRows().filter((_, i) => i !== index);
    this.assignmentRows.set(rows.length > 0 ? rows : [{ appId: null, roleId: null }]);
  }

  // ── Department / sub-department ───────────────────────────────────────────

  onDepartmentChange() {
    const deptId = this.createForm.value.departmentId ?? null;
    this.selectedDepartmentId.set(deptId);
    this.createForm.patchValue({ subDepartmentId: null });
    if (deptId) {
      this.adminService.getSubDepartmentsByDepartment(deptId).subscribe({
        next: subDepts => this.subDepartments.set(subDepts),
        error: () => this.subDepartments.set([])
      });
    } else {
      this.subDepartments.set([]);
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  saveCreate() {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    // Collect complete rows (both appId and roleId set)
    const completePairs = this.assignmentRows().filter(r => r.appId && r.roleId);

    // Deduplicate: silently collapse any accidental duplicate (appId+roleId) pairs
    const seen = new Set<string>();
    const uniquePairs = completePairs.filter(row => {
      const key = `${row.appId}-${row.roleId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const formValue = this.createForm.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);

    const createData: Partial<UserDto> = {
      login:    formValue.login,
      prenom:   formValue.prenom,
      nom:      formValue.nom,
      email:    formValue.email,
      authType: formValue.authType,
      status:   formValue.status || 'ACTIF',
      department: formValue.departmentId
        ? this.departments().find(d => d.id === formValue.departmentId)
        : null,
      subDepartmentId: formValue.subDepartmentId,
      password: formValue.authType === 'LOCAL' ? formValue.password : undefined,
      // Use the parallel-arrays contract that createUser() already supports
      applicationRoleApplicationIds: uniquePairs.map(r => r.appId as number),
      applicationRoleRoleIds:        uniquePairs.map(r => r.roleId as number)
    };

    this.adminService.createUser(createData as UserDto).subscribe({
      next: () => this.router.navigate(['/admin/users']),
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la création de l\'utilisateur');
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
