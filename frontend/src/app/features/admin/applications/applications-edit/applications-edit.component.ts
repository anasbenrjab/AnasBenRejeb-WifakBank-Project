import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { ApplicationDto } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-applications-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './applications-edit.component.html',
  styleUrl: './applications-edit.component.css'
})
export class ApplicationsEditComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly application = signal<ApplicationDto | null>(null);

  editForm = this.fb.nonNullable.group({
    code: ['', [Validators.required]],
    nom: ['', [Validators.required]],
    description: [''],
    url: [''],
    icon: [''],
    status: ['ACTIVE', [Validators.required]]
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.adminService.getApplication(id).subscribe({
      next: a => {
        this.application.set(a);
        this.editForm.patchValue({
          code: a.code,
          nom: a.nom,
          description: a.description,
          url: a.url,
          icon: a.icon,
          status: a.status || 'ACTIVE'
        });
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Erreur lors du chargement de l\'application');
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

    const updateData: Partial<ApplicationDto> = {
      code: formValue.code,
      nom: formValue.nom,
      description: formValue.description,
      url: formValue.url,
      icon: formValue.icon,
      status: formValue.status
    };

    this.adminService.updateApplication(id, updateData).subscribe({
      next: () => this.router.navigate(['/admin/applications']),
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la mise à jour de l\'application');
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/applications']);
  }
}
