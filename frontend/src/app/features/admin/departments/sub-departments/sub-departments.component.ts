import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { SubDepartmentDto, DepartmentDto } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-sub-departments',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sub-departments.component.html',
  styleUrl: './sub-departments.component.css'
})
export class SubDepartmentsComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly subDepartments = signal<SubDepartmentDto[]>([]);
  readonly departments = signal<DepartmentDto[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  // Filters
  readonly searchQuery = signal('');
  readonly selectedDepartmentId = signal<number | null>(null);

  // Computed list
  readonly filteredSubDepartments = computed(() => {
    let filtered = this.subDepartments();
    const query = this.searchQuery().toLowerCase();
    const deptId = this.selectedDepartmentId();

    if (deptId) {
      filtered = filtered.filter(sd => sd.departmentId === deptId);
    }

    if (query) {
      filtered = filtered.filter(sd => 
        sd.name.toLowerCase().includes(query) ||
        sd.departmentName.toLowerCase().includes(query)
      );
    }

    return filtered;
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.adminService.getDepartments().subscribe({
      next: (depts) => {
        this.departments.set(depts);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger les départements');
        this.loading.set(false);
      }
    });
    this.loadSubDepartments();
  }

  onDepartmentFilterChange(value: string): void {
    const departmentId = value ? Number(value) : null;
    this.selectedDepartmentId.set(departmentId);
    this.loadSubDepartments();
  }

  private loadSubDepartments(): void {
    this.loading.set(true);

    const request$ = this.selectedDepartmentId()
      ? this.adminService.getSubDepartmentsByDepartment(this.selectedDepartmentId()!)
      : this.adminService.getSubDepartments();

    request$.subscribe({
      next: subDepts => {
        this.subDepartments.set(subDepts);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger les sous-départements');
        this.loading.set(false);
      }
    });
  }

  deleteSubDepartment(id: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce sous-département?')) return;

    this.adminService.deleteSubDepartment(id).subscribe({
      next: () => this.loadData(),
      error: (err: any) => {
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la suppression du sous-département');
      }
    });
  }
}
