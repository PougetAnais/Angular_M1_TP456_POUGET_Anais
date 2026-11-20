import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../shared/utils/api-error-message';
import { AuthService } from '../../shared/services/auth.service';
import { AvatarId } from '../../shared/models/user.model';
import { AVATAR_DEFAULT, avatarChoices, avatarPresetUrl } from '../../shared/avatar-presets';

@Component({ imports: [ReactiveFormsModule, RouterLink], templateUrl: './register-page.html', styleUrl: './register-page.css' })
export class RegisterPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly error = signal('');
  readonly submitting = signal(false);
  readonly avatarChoices = avatarChoices;
  readonly avatarPresetUrl = avatarPresetUrl;
  readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(24), Validators.pattern(/^[a-zA-Z0-9_]+$/)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    visibility: new FormControl<'public' | 'private'>('public', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
    passwordConfirmation: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    avatarId: new FormControl<AvatarId>(AVATAR_DEFAULT, { nonNullable: true }),
  });

  passwordsMatch(): boolean { return this.form.controls.password.value === this.form.controls.passwordConfirmation.value; }

  submit(): void {
    this.error.set('');
    if (this.form.invalid || !this.passwordsMatch()) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    const values = this.form.getRawValue();
    this.auth.register(values.username.trim(), values.email, values.password, values.passwordConfirmation, values.visibility, values.avatarId).subscribe({
      next: () => { this.submitting.set(false); void this.router.navigateByUrl('/recommendations'); },
      error: (error: unknown) => {
        const status = error instanceof HttpErrorResponse ? error.status : 'inconnu';
        console.error(`[RegisterPage] Échec de l’inscription (HTTP ${status})`);
        this.error.set(apiErrorMessage(error, 'La création du compte a échoué. Réessayez.'));
        this.submitting.set(false);
      },
    });
  }
}
