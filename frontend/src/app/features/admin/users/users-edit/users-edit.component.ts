import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { UserDto, DepartmentDto } from '../../../../core/models/auth.models';

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
  readonly user = signal<UserDto | null>(null);

  editForm = this.fb.nonNullable.group({
    prenom: ['', [Validators.required]],
    nom: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    status: ['', [Validators.required]],
    departmentId: [null as number | null, []]
  });

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.adminService.getDepartments().subscribe({
      next: deps => this.departments.set(deps),
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
          departmentId: user.department?.id ?? null
        });
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Erreur lors du chargement de l’utilisateur');
        this.loading.set(false);
      }
    });
  }

  saveUser() {
    if (this.editForm.invalid) return;

    const id = Number(this.route.snapshot.paramMap.get('id'));
    const formValue = this.editForm.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);

    const updateData: Partial<UserDto> = {
      prenom: formValue.prenom,
      nom: formValue.nom,
      email: formValue.email,
      status: formValue.status,
      department: formValue.departmentId
        ? this.departments().find(d => d.id === formValue.departmentId)
        : undefined
    };

    this.adminService.updateUser(id, updateData).subscribe({
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
