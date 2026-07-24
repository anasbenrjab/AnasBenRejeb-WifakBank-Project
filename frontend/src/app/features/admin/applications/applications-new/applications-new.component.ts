import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { ApplicationDto } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-applications-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './applications-new.component.html',
  styleUrl: './applications-new.component.css'
})
export class ApplicationsNewComponent {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  createForm = this.fb.nonNullable.group({
    code: ['', [Validators.required]],
    nom: ['', [Validators.required]],
    description: [''],
    url: [''],
    icon: [''],
    status: ['ACTIVE', [Validators.required]]
  });

  saveCreate(): void {
    if (this.createForm.invalid) return;

    const formValue = this.createForm.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);

    const createData: ApplicationDto = {
      id: 0,
      code: formValue.code,
      nom: formValue.nom,
      description: formValue.description,
      url: formValue.url,
      icon: formValue.icon,
      status: formValue.status
    };

    this.adminService.createApplication(createData).subscribe({
      next: () => this.router.navigate(['/admin/applications']),
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la création de l\'application');
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/applications']);
  }
}
