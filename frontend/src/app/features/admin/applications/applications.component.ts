import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { ApplicationDto, RoleDto } from '../../../core/models/auth.models';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './applications.component.html',
  styleUrl: './applications.component.css'
})
export class ApplicationsComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly applications = signal<ApplicationDto[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  // Filters
  readonly searchQuery = signal('');
  readonly statusFilter = signal<string>('all');

  // Computed list
  readonly filteredApplications = computed(() => {
    let filtered = this.applications();
    const query = this.searchQuery().toLowerCase();

    if (query) {
      filtered = filtered.filter(a => 
        a.code.toLowerCase().includes(query) ||
        a.nom.toLowerCase().includes(query) ||
        (a.description?.toLowerCase() || '').includes(query)
      );
    }

    if (this.statusFilter() !== 'all') {
      filtered = filtered.filter(a => a.status === this.statusFilter());
    }

    return filtered;
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.adminService.getApplications().subscribe({
      next: applications => {
        this.applications.set(applications);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger les applications');
        this.loading.set(false);
      }
    });
  }

  deleteApplication(id: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette application?')) return;

    this.adminService.deleteApplication(id).subscribe({
      next: () => this.loadData(),
      error: (err: any) => {
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la suppression de l\'application');
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    return status === 'ACTIVE' ? 'badge badge-active' : 'badge badge-inactive';
  }

  getRolesSummary(roles?: RoleDto[] | null): string {
    if (!roles || roles.length === 0) return 'Aucun rôle';
    if (roles.length === 1) return roles[0].nom;
    return `${roles.length} rôles (${roles.map(r => r.nom).join(', ')})`;
  }
}
