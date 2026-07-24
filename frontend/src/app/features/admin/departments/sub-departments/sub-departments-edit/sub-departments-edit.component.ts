import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminService } from '../../../../../core/services/admin.service';
import { SubDepartmentDto, DepartmentDto } from '../../../../../core/models/auth.models';

@Component({
  selector: 'app-sub-departments-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sub-departments-edit.component.html',
  styleUrl: './sub-departments-edit.component.css'
})
export class SubDepartmentsEditComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly subDepartment = signal<SubDepartmentDto | null>(null);
  readonly departments = signal<DepartmentDto[]>([]);

  editForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    departmentId: ['', [Validators.required]]
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.adminService.getDepartments().subscribe({
      next: (depts) => {
        this.departments.set(depts);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger les départements');
        this.loading.set(false);
      }
    });

    this.adminService.getSubDepartments().subscribe({
      next: (subDepts) => {
        const subDept = subDepts.find(sd => sd.id === id);
        if (subDept) {
          this.subDepartment.set(subDept);
          this.editForm.patchValue({
            name: subDept.name,
            departmentId: String(subDept.departmentId)
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Erreur lors du chargement du sous-département');
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

    const updateData: Partial<SubDepartmentDto> = {
      name: formValue.name,
      departmentId: Number(formValue.departmentId)
    };

    this.adminService.updateSubDepartment(id, updateData).subscribe({
      next: () => this.router.navigate(['/admin/sub-departments']),
      error: (err: any) => {
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la mise à jour du sous-département');
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/sub-departments']);
  }
}
