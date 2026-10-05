import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { ApplicationDto, DepartmentDto, RoleDto } from '../../../../core/models/auth.models';
import { AppIconComponent } from '../../../../shared/components/app-icon/app-icon.component';
import { BI_ICON_LIST } from '../applications-edit/applications-edit.component';

@Component({
  selector: 'app-applications-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent],
  templateUrl: './applications-new.component.html',
  styleUrl: './applications-new.component.css'
})
export class ApplicationsNewComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly departments = signal<DepartmentDto[]>([]);
  readonly roles = signal<RoleDto[]>([]);
  readonly selectedRoleIds = signal<Set<number>>(new Set());

  // Field-level 409 error signals — cleared on next submit
  readonly codeError   = signal<string | null>(null);
  readonly nomError    = signal<string | null>(null);
  readonly urlError    = signal<string | null>(null);

  // Icon picker state
  readonly iconSearch = signal('');
  readonly allIcons = BI_ICON_LIST;
  get filteredIcons(): string[] {
    const q = this.iconSearch().toLowerCase();
    return q ? this.allIcons.filter(i => i.includes(q)) : this.allIcons;
  }

  createForm = this.fb.nonNullable.group({
    code:         ['', [Validators.required]],
    nom:          ['', [Validators.required]],
    description:  [''],
    url:          ['', [Validators.required]],
    icon:         ['bi-app'],
    status:       ['ACTIVE', [Validators.required]],
    departmentId: [null as number | null, []],
    // Phase 2
    launchMode:   ['IFRAME', [Validators.required]],
    category:     ['' as string, [Validators.maxLength(100)]],
    displayOrder: [0 as number, [Validators.min(0)]]
  });

  ngOnInit(): void {
    this.adminService.getDepartments().subscribe({
      next: deps => this.departments.set(deps),
      error: () => {}
    });
    this.adminService.getRoles().subscribe({
      next: roles => this.roles.set(roles),
      error: () => {}
    });
  }

  toggleRole(roleId: number): void {
    const current = new Set(this.selectedRoleIds());
    if (current.has(roleId)) {
      current.delete(roleId);
    } else {
      current.add(roleId);
    }
    this.selectedRoleIds.set(current);
  }

  isRoleSelected(roleId: number): boolean {
    return this.selectedRoleIds().has(roleId);
  }

  get noRoleChecked(): boolean {
    return this.selectedRoleIds().size === 0;
  }

  selectNoRole(): void {
    this.selectedRoleIds.set(new Set());
  }

  getDepartmentName(dept?: DepartmentDto): string {
    return dept ? `${dept.code} - ${dept.name}` : 'Non assigné';
  }

  saveCreate(): void {
    if (this.createForm.invalid) return;

    const formValue = this.createForm.getRawValue();
    this.loading.set(true);
    // Clear all error signals before each submit
    this.errorMessage.set(null);
    this.codeError.set(null);
    this.nomError.set(null);
    this.urlError.set(null);

    const createData: Partial<ApplicationDto> = {
      code:         formValue.code,
      nom:          formValue.nom,
      description:  formValue.description,
      url:          formValue.url,
      icon:         formValue.icon,
      iconType:     'BOOTSTRAP_ICON',
      status:       formValue.status,
      departmentId: formValue.departmentId,
      roleIds:      Array.from(this.selectedRoleIds()),
      // Phase 2
      launchMode:   formValue.launchMode as 'IFRAME' | 'NEW_TAB' | 'REDIRECT',
      category:     formValue.category || null,
      displayOrder: formValue.displayOrder ?? 0
    };

    this.adminService.createApplication(createData).subscribe({
      next: () => this.router.navigate(['/admin/applications']),
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.handle409(err);
      }
    });
  }

  /**
   * Routes a 409 Conflict response to the correct field error signal using
   * the structured "field" property from the ErrorResponse body.
   * Falls back to the top-level errorMessage for non-409 or unmapped errors.
   * Form input is preserved in all cases.
   */
  private handle409(err: HttpErrorResponse): void {
    const msg: string   = err?.error?.message ?? '';
    const field: string = err?.error?.field   ?? '';
    if (err.status === 409) {
      switch (field) {
        case 'code': this.codeError.set(msg); break;
        case 'nom':  this.nomError.set(msg);  break;
        case 'url':  this.urlError.set(msg);  break;
        default:     this.errorMessage.set(msg || 'Erreur lors de l\'enregistrement.');
      }
    } else {
      this.errorMessage.set(msg || 'Erreur lors de la création de l\'application');
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/applications']);
  }
}
