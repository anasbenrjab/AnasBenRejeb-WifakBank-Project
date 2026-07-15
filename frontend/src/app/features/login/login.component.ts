import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ErrorResponse } from '../../core/models/auth.models';
import { HttpErrorResponse } from '@angular/common/http';
import { OtpStepComponent } from './otp-step/otp-step.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, OtpStepComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading      = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  // ── OTP step state ────────────────────────────────────────────────────────
  /** When true, hide the credentials form and show the OTP form. */
  readonly otpRequired  = signal(false);
  /** Login stored after step 1 succeeds — passed to the OTP step. */
  readonly pendingLogin = signal<string>('');

  form = this.fb.nonNullable.group({
    login:    ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  /** Step 1: validate credentials → expect otpRequired=true from backend. */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.otpRequired) {
          // Store login for step 2, then show OTP screen
          this.pendingLogin.set(res.login);
          this.otpRequired.set(true);
        } else {
          // Fallback: if backend skips OTP (shouldn't happen), go straight to dashboard
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const body = err.error as ErrorResponse;
        this.errorMessage.set(
          body?.message ?? 'Erreur de connexion. Veuillez réessayer.'
        );
      }
    });
  }

  /** Called by OtpStepComponent when OTP verification succeeds. */
  onOtpVerified(): void {
    this.router.navigate(['/dashboard']);
  }

  /** Called by OtpStepComponent if the user wants to go back to step 1. */
  onBackToLogin(): void {
    this.otpRequired.set(false);
    this.pendingLogin.set('');
    this.errorMessage.set(null);
    this.form.reset();
  }

  get loginCtrl()    { return this.form.controls.login; }
  get passwordCtrl() { return this.form.controls.password; }
}
