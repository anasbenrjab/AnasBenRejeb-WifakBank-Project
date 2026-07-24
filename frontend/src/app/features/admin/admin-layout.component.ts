import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
  readonly auth = inject(AuthService);
  showUserMenu = false;
  isSidebarOpen = false;

  get user() {
    return this.auth.currentUser();
  }

  get avatarGradient(): string {
    return `linear-gradient(135deg, #47617f 0%, #6f869f 50%, #899baa 100%)`;
  }

  getUserInitials(): string {
    if (!this.user) return '?';
    const prenom = this.user.prenom || '';
    const nom = this.user.nom || '';
    return (prenom.charAt(0) + nom.charAt(0)).toUpperCase() || '?';
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  logout(): void {
    this.showUserMenu = false;
    this.auth.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.topbar-user') && !target.closest('.user-dropdown')) {
      this.showUserMenu = false;
    }
    if (!target.closest('.sidebar') && !target.closest('.btn-toggle') && window.innerWidth <= 768) {
      this.closeSidebar();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(): void {
    if (this.isSidebarOpen) {
      this.closeSidebar();
    }
    this.showUserMenu = false;
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    if (window.innerWidth > 768 && this.isSidebarOpen) {
      this.closeSidebar();
    }
  }
}