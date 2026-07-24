import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { DepartmentDto } from '../../../core/models/auth.models';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './departments.component.html',
  styleUrl: './departments.component.css'
})
export class DepartmentsComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly departments = signal<DepartmentDto[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  // Filters
  readonly searchQuery = signal('');

  // Computed list
  readonly filteredDepartments = computed(() => {
    let filtered = this.departments();
    const query = this.searchQuery().toLowerCase();

    if (query) {
      filtered = filtered.filter(d => 
        d.code.toLowerCase().includes(query) ||
        d.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.adminService.getDepartments().subscribe({
      next: departments => {
        this.departments.set(departments);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger les départements');
        this.loading.set(false);
      }
    });
  }

  deleteDepartment(id: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce département?')) return;

    this.adminService.deleteDepartment(id).subscribe({
      next: () => this.loadData(),
      error: (err: any) => {
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la suppression du département');
      }
    });
  }
}
