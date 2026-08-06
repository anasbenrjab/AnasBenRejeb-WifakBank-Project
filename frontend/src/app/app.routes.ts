import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { AdminLayoutComponent } from './features/admin/admin-layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'app/:id',
        loadComponent: () =>
          import('./features/dashboard/app-viewer/app-viewer.component').then(m => m.AppViewerComponent)
      }
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'users/new',
        loadComponent: () =>
          import('./features/admin/users/users-new/users-new.component').then(m => m.UsersNewComponent)
      },
      {
        path: 'users/:id/edit',
        loadComponent: () =>
          import('./features/admin/users/users-edit/users-edit.component').then(m => m.UsersEditComponent)
      },
      {
        path: 'users/:id',
        loadComponent: () =>
          import('./features/admin/users/users-detail/users-detail.component').then(m => m.UsersDetailComponent)
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./features/admin/roles/roles.component').then(m => m.RolesComponent)
      },
      {
        path: 'roles/new',
        loadComponent: () =>
          import('./features/admin/roles/roles-new/roles-new.component').then(m => m.RolesNewComponent)
      },
      {
        path: 'roles/:id/edit',
        loadComponent: () =>
          import('./features/admin/roles/roles-edit/roles-edit.component').then(m => m.RolesEditComponent)
      },
      {
        path: 'departments',
        loadComponent: () =>
          import('./features/admin/departments/departments.component').then(m => m.DepartmentsComponent)
      },
      {
        path: 'departments/new',
        loadComponent: () =>
          import('./features/admin/departments/departments-new/departments-new.component').then(m => m.DepartmentsNewComponent)
      },
      {
        path: 'departments/:id/edit',
        loadComponent: () =>
          import('./features/admin/departments/departments-edit/departments-edit.component').then(m => m.DepartmentsEditComponent)
      },
      {
        path: 'sub-departments',
        loadComponent: () =>
          import('./features/admin/departments/sub-departments/sub-departments.component').then(m => m.SubDepartmentsComponent)
      },
      {
        path: 'sub-departments/new',
        loadComponent: () =>
          import('./features/admin/departments/sub-departments/sub-departments-new/sub-departments-new.component').then(m => m.SubDepartmentsNewComponent)
      },
      {
        path: 'sub-departments/:id/edit',
        loadComponent: () =>
          import('./features/admin/departments/sub-departments/sub-departments-edit/sub-departments-edit.component').then(m => m.SubDepartmentsEditComponent)
      },
      {
        path: 'applications',
        loadComponent: () =>
          import('./features/admin/applications/applications.component').then(m => m.ApplicationsComponent)
      },
      {
        path: 'applications/new',
        loadComponent: () =>
          import('./features/admin/applications/applications-new/applications-new.component').then(m => m.ApplicationsNewComponent)
      },
      {
        path: 'applications/:id/edit',
        loadComponent: () =>
          import('./features/admin/applications/applications-edit/applications-edit.component').then(m => m.ApplicationsEditComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
