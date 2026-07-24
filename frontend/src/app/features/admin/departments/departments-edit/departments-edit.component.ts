import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { DepartmentDto } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-departments-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './departments-edit.component.html',
  styleUrl: './departments-edit.component.css'
})
export class DepartmentsEditComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly department = signal<DepartmentDto | null>(null);

  editForm = this.fb.nonNullable.group({
    code: ['', [Validators.required]],
    name: ['', [Validators.required]]
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.adminService.getDepartment(id).subscribe({
      next: d => {
        this.department.set(d);
        this.editForm.patchValue({
          code: d.code,
          name: d.name
        });
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Erreur lors du chargement du département');
        this.loading.set(false);
      }
    });
  }

  save(): void {
    if (this.editForm.invalid) return;

    const id = Number(this.route.snapshot.paramMap.get('id'));
    const formValue = this.editForm.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);

    const updateData: Partial<DepartmentDto> = {
      code: formValue.code,
      name: formValue.name
    };

    this.adminService.updateDepartment(id, updateData).subscribe({
      next: () => this.router.navigate(['/admin/departments']),
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la mise à jour du département');
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/departments']);
  }
}
