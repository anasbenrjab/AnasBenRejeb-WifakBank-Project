import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { ApplicationDto, DepartmentDto, RoleDto } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-applications-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './applications-edit.component.html',
  styleUrl: './applications-edit.component.css'
})
export class ApplicationsEditComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly application = signal<ApplicationDto | null>(null);
  readonly departments = signal<DepartmentDto[]>([]);
  readonly roles = signal<RoleDto[]>([]);
  readonly selectedRoleIds = signal<Set<number>>(new Set());

  editForm = this.fb.nonNullable.group({
    code: ['', [Validators.required]],
    nom: ['', [Validators.required]],
    description: [''],
    url: [''],
    icon: [''],
    status: ['ACTIVE', [Validators.required]],
    departmentId: [null as number | null, []]
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.adminService.getDepartments().subscribe({
      next: deps => this.departments.set(deps),
      error: () => {}
    });
    this.adminService.getRoles().subscribe({
      next: roles => this.roles.set(roles),
      error: () => {}
    });

    this.adminService.getApplication(id).subscribe({
      next: a => {
        this.application.set(a);
        this.editForm.patchValue({
          code: a.code,
          nom: a.nom,
          description: a.description,
          url: a.url,
          icon: a.icon,
          status: a.status || 'ACTIVE',
          departmentId: a.departmentId ?? null
        });
        if (a.roleIds) {
          this.selectedRoleIds.set(new Set(a.roleIds));
        } else if (a.roles) {
          this.selectedRoleIds.set(new Set(a.roles.map(r => r.id)));
        }
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Erreur lors du chargement de l\'application');
        this.loading.set(false);
      }
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

  get noRoleChecked(): boolean {
    return this.selectedRoleIds().size === 0;
  }

  selectNoRole(): void {
    this.selectedRoleIds.set(new Set());
  }

  getDepartmentName(dept?: DepartmentDto): string {
    return dept ? `${dept.code} - ${dept.name}` : 'Non assigné';
  }

  save(): void {
    if (this.editForm.invalid) return;

    const id = Number(this.route.snapshot.paramMap.get('id'));
    const formValue = this.editForm.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);

    const updateData: Partial<ApplicationDto> = {
      code: formValue.code,
      nom: formValue.nom,
      description: formValue.description,
      url: formValue.url,
      icon: formValue.icon,
      status: formValue.status,
      departmentId: formValue.departmentId,
      roleIds: Array.from(this.selectedRoleIds())
    };

    this.adminService.updateApplication(id, updateData).subscribe({
      next: () => this.router.navigate(['/admin/applications']),
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la mise à jour de l\'application');
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/applications']);
  }
}
