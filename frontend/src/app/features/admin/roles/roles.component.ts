import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { RoleDto, ApplicationDto } from '../../../core/models/auth.models';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.css'
})
export class RolesComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  readonly roles = signal<RoleDto[]>([]);
  readonly applications = signal<ApplicationDto[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly editingRoleId = signal<number | null>(null);
  readonly showCreateForm = signal(false);

  editForm = this.fb.nonNullable.group({
    applicationId: [0 as number, [Validators.required, Validators.min(1)]],
    nom: ['', [Validators.required]],
    description: ['']
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);

    this.adminService.getApplications().subscribe({
      next: apps => {
        this.applications.set(apps);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger les applications');
      }
    });

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

  startCreate(): void {
    this.showCreateForm.set(true);
    this.editingRoleId.set(null);
    this.editForm.reset();
  }

  startEdit(role: RoleDto): void {
    this.editingRoleId.set(role.id);
    this.showCreateForm.set(false);
    this.editForm.patchValue({
      applicationId: role.application.id,
      nom: role.nom,
      description: role.description
    });
  }

  cancel(): void {
    this.editingRoleId.set(null);
    this.showCreateForm.set(false);
    this.editForm.reset();
  }

  saveRole(): void {
    if (this.editForm.invalid) return;

    const formValue = this.editForm.getRawValue();
    const selectedApp = this.applications().find(a => a.id === formValue.applicationId);
    if (!selectedApp) return;

    const roleData: RoleDto = {
      id: 0,
      application: selectedApp,
      nom: formValue.nom,
      description: formValue.description
    };

    const save$ = this.editingRoleId()
      ? this.adminService.updateRole(this.editingRoleId()!, roleData)
      : this.adminService.createRole(roleData);

    save$.subscribe({
      next: () => {
        this.cancel();
        this.loadData();
      },
      error: () => {
        this.errorMessage.set('Erreur lors de la sauvegarde du rôle');
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
