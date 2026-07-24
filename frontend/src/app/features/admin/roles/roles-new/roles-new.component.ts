import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { RoleDto } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-roles-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './roles-new.component.html',
  styleUrl: './roles-new.component.css'
})
export class RolesNewComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  createForm = this.fb.nonNullable.group({
    nom: ['', [Validators.required]],
    description: ['']
  });

  ngOnInit(): void {
  }

  saveCreate(): void {
    if (this.createForm.invalid) return;

    const formValue = this.createForm.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);

    const createData: Partial<RoleDto> = {
      nom: formValue.nom,
      description: formValue.description
    };

    this.adminService.createRole(createData).subscribe({
      next: () => this.router.navigate(['/admin/roles']),
      error: (err: any) => {
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la création du rôle');
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/roles']);
  }
}
