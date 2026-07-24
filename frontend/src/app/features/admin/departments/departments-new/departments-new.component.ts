import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { DepartmentDto } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-departments-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './departments-new.component.html',
  styleUrl: './departments-new.component.css'
})
export class DepartmentsNewComponent {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  createForm = this.fb.nonNullable.group({
    code: ['', [Validators.required]],
    name: ['', [Validators.required]]
  });

  saveCreate(): void {
    if (this.createForm.invalid) return;

    const formValue = this.createForm.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);

    const createData: Partial<DepartmentDto> = {
      code: formValue.code,
      name: formValue.name
    };

    this.adminService.createDepartment(createData).subscribe({
      next: () => this.router.navigate(['/admin/departments']),
      error: (err: any) => {
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la création du département');
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/departments']);
  }
}
