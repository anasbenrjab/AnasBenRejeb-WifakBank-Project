import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { RoleDto } from '../../../core/models/auth.models';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.css'
})
export class RolesComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly roles = signal<RoleDto[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  // Filters
  readonly searchQuery = signal('');

  // Computed list
  readonly filteredRoles = computed(() => {
    let filtered = this.roles();
    const query = this.searchQuery().toLowerCase();

    if (query) {
      filtered = filtered.filter(r => 
        r.nom.toLowerCase().includes(query) ||
        (r.description?.toLowerCase() || '').includes(query)
      );
    }

    return filtered;
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.adminService.getRoles().subscribe({
      next: roles => {
        this.roles.set(roles);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger les rôles');
        this.loading.set(false);
      }
    });
  }

  deleteRole(id: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rôle?')) return;

    this.adminService.deleteRole(id).subscribe({
      next: () => this.loadData(),
      error: (err: any) => {
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la suppression du rôle');
      }
    });
  }
}
