import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { DepartmentDto } from '../../../core/models/auth.models';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './departments.component.html',
  styleUrl: './departments.component.css'
})
export class DepartmentsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  readonly departments = signal<DepartmentDto[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly editingDeptId = signal<number | null>(null);
  readonly showCreateForm = signal(false);

  editForm = this.fb.nonNullable.group({
    code: ['', [Validators.required]],
    name: ['', [Validators.required]],
    description: ['']
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.adminService.getDepartments().subscribe({
      next: depts => {
        this.departments.set(depts);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger les départements');
        this.loading.set(false);
      }
    });
  }

  startCreate(): void {
    this.showCreateForm.set(true);
    this.editingDeptId.set(null);
    this.editForm.reset();
  }

  startEdit(dept: DepartmentDto): void {
    this.editingDeptId.set(dept.id);
    this.showCreateForm.set(false);
    this.editForm.patchValue({
      code: dept.code,
      name: dept.name,
      description: dept.description
    });
  }

  cancel(): void {
    this.editingDeptId.set(null);
    this.showCreateForm.set(false);
    this.editForm.reset();
  }

  saveDept(): void {
    if (this.editForm.invalid) return;

    const formValue = this.editForm.getRawValue();
    const deptData: DepartmentDto = {
      id: 0,
      code: formValue.code,
      name: formValue.name,
      description: formValue.description
    };

    const save$ = this.editingDeptId() 
      ? this.adminService.updateDepartment(this.editingDeptId()!, deptData)
      : this.adminService.createDepartment(deptData);

    save$.subscribe({
      next: () => {
        this.cancel();
        this.loadData();
      },
      error: () => {
        this.errorMessage.set('Erreur lors de la sauvegarde du département');
      }
    });
  }

  deleteDept(id: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce département?')) return;
    
    this.adminService.deleteDepartment(id).subscribe({
      next: () => this.loadData(),
      error: () => {
        this.errorMessage.set('Erreur lors de la suppression du département');
      }
    });
  }
}
