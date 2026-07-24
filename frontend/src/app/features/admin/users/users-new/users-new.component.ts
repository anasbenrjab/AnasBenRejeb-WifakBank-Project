import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { UserDto, DepartmentDto } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-users-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users-new.component.html',
  styleUrl: './users-new.component.css'
})
export class UsersNewComponent {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly departments = signal<DepartmentDto[]>([]);

  createForm = this.fb.nonNullable.group({
    login: ['', [Validators.required]],
    prenom: ['', [Validators.required]],
    nom: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    authType: ['AD', [Validators.required]],
    status: ['ACTIVE', [Validators.required]],
    password: ['', []],
    departmentId: [null as number | null, []]
  });

  ngOnInit() {
    this.adminService.getDepartments().subscribe({
      next: deps => this.departments.set(deps),
      error: () => {}
    });
  }

  saveCreate() {
    if (this.createForm.invalid) return;

    const formValue = this.createForm.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);

    const createData: UserDto = {
      id: 0,
      login: formValue.login,
      prenom: formValue.prenom,
      nom: formValue.nom,
      email: formValue.email,
      authType: formValue.authType,
      status: formValue.status,
      department: formValue.departmentId
        ? this.departments().find(d => d.id === formValue.departmentId)
        : undefined,
      password: formValue.authType === 'LOCAL' ? formValue.password : undefined
    };

    this.adminService.createUser(createData).subscribe({
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
