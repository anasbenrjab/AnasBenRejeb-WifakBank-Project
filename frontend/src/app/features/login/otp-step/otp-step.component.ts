import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorResponse } from '../../../core/models/auth.models';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-otp-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './otp-step.component.html',
  styleUrl: './otp-step.component.css'
})
export class OtpStepComponent implements OnInit {
  /** The login returned from step 1 — passed in by the parent. */
  @Input({ required: true }) login!: string;

  /** Emitted when OTP verification succeeds. Parent navigates to dashboard. */
  @Output() verified = new EventEmitter<void>();

  /** Emitted when the user clicks "Retour" to go back to step 1. */
  @Output() back = new EventEmitter<void>();

  private readonly fb   = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly loading      = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  /** Countdown in seconds until the user can request a resend. */
  readonly resendCooldown = signal(30);
  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  form = this.fb.nonNullable.group({
    code: ['', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(6),
      Validators.pattern(/^\d{6}$/)
    ]]
  });

  ngOnInit(): void {
    this.startCooldown();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const code = this.form.getRawValue().code;

    this.auth.verifyOtp(this.login, code).subscribe({
      next: () => {
        this.loading.set(false);
        this.verified.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const body = err.error as ErrorResponse;
        this.errorMessage.set(
          body?.message ?? 'Code OTP invalide. Veuillez réessayer.'
        );
        // Clear the input so the user can re-type
        this.form.reset();
      }
    });
  }

  onResend(): void {
    if (this.resendCooldown() > 0) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.auth.resendOtp(this.login).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('Un nouveau code a été envoyé à votre adresse e-mail.');
        this.form.reset();
        this.startCooldown();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const body = err.error as ErrorResponse;
        this.errorMessage.set(
          body?.message ?? 'Erreur lors de l\'envoi du code. Réessayez.'
        );
      }
    });
  }

  onBack(): void {
    this.clearCooldown();
    this.back.emit();
  }

  get codeCtrl() { return this.form.controls.code; }

  // ── private ───────────────────────────────────────────────────────────────

  private startCooldown(): void {
    this.clearCooldown();
    this.resendCooldown.set(30);
    this.cooldownInterval = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.resendCooldown.set(0);
        this.clearCooldown();
      } else {
        this.resendCooldown.update(v => v - 1);
      }
    }, 1000);
  }

  private clearCooldown(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = null;
    }
  }
}
