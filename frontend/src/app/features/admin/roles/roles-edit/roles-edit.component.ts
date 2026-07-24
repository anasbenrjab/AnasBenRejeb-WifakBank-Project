import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { RoleDto } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-roles-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './roles-edit.component.html',
  styleUrl: './roles-edit.component.css'
})
export class RolesEditComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly loadingData = signal(true);
  readonly errorMessage = signal<string | null>(null);

  editForm = this.fb.nonNullable.group({
    nom: ['', [Validators.required]],
    description: ['']
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.adminService.getRoles().subscribe({
      next: roles => {
        const role = roles.find(r => r.id === id);
        if (role) {
          this.editForm.patchValue({
            nom: role.nom,
            description: role.description || ''
          });
        }
        this.loadingData.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger le rôle');
        this.loadingData.set(false);
      }
    });
  }

  saveEdit(): void {
    if (this.editForm.invalid) return;

    const id = Number(this.route.snapshot.paramMap.get('id'));
    const formValue = this.editForm.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);

    const editData: Partial<RoleDto> = {
      nom: formValue.nom,
      description: formValue.description
    };

    this.adminService.updateRole(id, editData).subscribe({
      next: () => this.router.navigate(['/admin/roles']),
      error: (err: any) => {
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la modification du rôle');
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/roles']);
  }
}
