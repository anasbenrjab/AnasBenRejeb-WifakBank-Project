import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { ApplicationDto, DepartmentDto, RoleDto } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-applications-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './applications-new.component.html',
  styleUrl: './applications-new.component.css'
})
export class ApplicationsNewComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly departments = signal<DepartmentDto[]>([]);
  readonly roles = signal<RoleDto[]>([]);
  readonly selectedRoleIds = signal<Set<number>>(new Set());

  createForm = this.fb.nonNullable.group({
    code: ['', [Validators.required]],
    nom: ['', [Validators.required]],
    description: [''],
    url: [''],
    icon: [''],
    status: ['ACTIVE', [Validators.required]],
    departmentId: [null as number | null, []]
  });

  ngOnInit(): void {
    this.adminService.getDepartments().subscribe({
      next: deps => this.departments.set(deps),
      error: () => {}
    });
    this.adminService.getRoles().subscribe({
      next: roles => this.roles.set(roles),
      error: () => {}
    });
  }

  toggleRole(roleId: number): void {
    const current = new Set(this.selectedRoleIds());
    if (current.has(roleId)) {
      current.delete(roleId);
    } else {
      current.add(roleId);
    }
    this.selectedRoleIds.set(current);
  }

  isRoleSelected(roleId: number): boolean {
    return this.selectedRoleIds().has(roleId);
  }

  getDepartmentName(dept?: DepartmentDto): string {
    return dept ? `${dept.code} - ${dept.name}` : 'Non assigné';
  }

  saveCreate(): void {
    if (this.createForm.invalid) return;

    const formValue = this.createForm.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);

    const createData: Partial<ApplicationDto> = {
      code: formValue.code,
      nom: formValue.nom,
      description: formValue.description,
      url: formValue.url,
      icon: formValue.icon,
      status: formValue.status,
      departmentId: formValue.departmentId,
      roleIds: Array.from(this.selectedRoleIds())
    };

    this.adminService.createApplication(createData).subscribe({
      next: () => this.router.navigate(['/admin/applications']),
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la création de l\'application');
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/applications']);
  }
}
