import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../../../core/services/admin.service';
import { SubDepartmentDto, DepartmentDto } from '../../../../../core/models/auth.models';

@Component({
  selector: 'app-sub-departments-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sub-departments-new.component.html',
  styleUrl: './sub-departments-new.component.css'
})
export class SubDepartmentsNewComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly departments = signal<DepartmentDto[]>([]);

  createForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    departmentId: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.adminService.getDepartments().subscribe({
      next: (depts) => {
        this.departments.set(depts);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger les départements');
      }
    });
  }

  saveCreate(): void {
    if (this.createForm.invalid) return;

    const formValue = this.createForm.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);

    const createData: Partial<SubDepartmentDto> = {
      name: formValue.name,
      departmentId: Number(formValue.departmentId)
    };

    this.adminService.createSubDepartment(createData).subscribe({
      next: () => this.router.navigate(['/admin/sub-departments']),
      error: (err: any) => {
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la création du sous-département');
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/sub-departments']);
  }
}
