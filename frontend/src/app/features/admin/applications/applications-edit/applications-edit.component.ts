import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { ApplicationDto, DepartmentDto, RoleDto } from '../../../../core/models/auth.models';
import { AppIconComponent } from '../../../../shared/components/app-icon/app-icon.component';

// A curated set of Bootstrap Icons useful for application tiles.
// Stored as plain names — AppIconComponent prepends "bi-" automatically.
export const BI_ICON_LIST: string[] = [
  'app','grid','grid-3x3-gap','window','display','laptop','phone','tablet',
  'folder','folder2-open','archive','file-earmark','file-earmark-text',
  'file-earmark-pdf','file-earmark-spreadsheet','file-earmark-code',
  'people','person','person-badge','person-gear','person-check',
  'briefcase','building','bank','bank2','cash','cash-coin','credit-card',
  'currency-dollar','currency-euro','graph-up','bar-chart','pie-chart',
  'shield','shield-lock','shield-check','lock','key','gear','gear-wide',
  'bell','envelope','chat','chat-dots','telephone','camera','image',
  'globe','wifi','cloud','cloud-upload','cloud-download',
  'calendar','clock','alarm','house','star','heart','lightning',
  'search','filter','funnel','list','table','kanban','diagram-3',
  'cpu','database','hdd','server','router','code','code-slash','terminal',
  'tools','wrench','hammer','box','boxes','cart','bag','shop',
  'truck','airplane','map','map','compass','flag','trophy',
];

@Component({
  selector: 'app-applications-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent],
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
  readonly departments = signal<DepartmentDto[]>([]);
  readonly roles = signal<RoleDto[]>([]);
  readonly selectedRoleIds = signal<Set<number>>(new Set());

  // Field-level 409 error signals — cleared on next submit
  readonly codeError = signal<string | null>(null);
  readonly nomError  = signal<string | null>(null);
  readonly urlError  = signal<string | null>(null);

  // Icon picker state
  readonly iconSearch = signal('');
  readonly allIcons = BI_ICON_LIST;
  get filteredIcons(): string[] {
    const q = this.iconSearch().toLowerCase();
    return q ? this.allIcons.filter(i => i.includes(q)) : this.allIcons;
  }

  editForm = this.fb.nonNullable.group({
    code: ['', [Validators.required]],
    nom: ['', [Validators.required]],
    description: [''],
    url: ['', [Validators.required]],
    icon: ['bi-app'],
    status: ['ACTIVE', [Validators.required]],
    departmentId: [null as number | null, []],
    // Phase 2
    launchMode:   ['IFRAME', [Validators.required]],
    category:     ['' as string, [Validators.maxLength(100)]],
    displayOrder: [0 as number, [Validators.min(0)]]
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.adminService.getDepartments().subscribe({
      next: deps => this.departments.set(deps),
      error: () => {}
    });
    this.adminService.getRoles().subscribe({
      next: roles => this.roles.set(roles),
      error: () => {}
    });

    this.adminService.getApplication(id).subscribe({
      next: a => {
        this.application.set(a);
        this.editForm.patchValue({
          code: a.code,
          nom: a.nom,
          description: a.description,
          url: a.url,
          icon: a.icon ?? 'bi-app',
          status: a.status || 'ACTIVE',
          departmentId: a.departmentId ?? null,
          // Phase 2
          launchMode:   a.launchMode   ?? 'IFRAME',
          category:     a.category     ?? '',
          displayOrder: a.displayOrder ?? 0
        });
        if (a.roleIds) {
          this.selectedRoleIds.set(new Set(a.roleIds));
        } else if (a.roles) {
          this.selectedRoleIds.set(new Set(a.roles.map(r => r.id)));
        }
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Erreur lors du chargement de l\'application');
        this.loading.set(false);
      }
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

  save(): void {
    if (this.editForm.invalid) return;

    const id = Number(this.route.snapshot.paramMap.get('id'));
    const formValue = this.editForm.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);
    this.codeError.set(null);
    this.nomError.set(null);
    this.urlError.set(null);

    const updateData: Partial<ApplicationDto> = {
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

    this.adminService.updateApplication(id, updateData).subscribe({
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
      this.errorMessage.set(msg || 'Erreur lors de la mise à jour de l\'application');
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/applications']);
  }
}
