import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../shared/utils/api-error-message';
import { AuthService } from '../../shared/services/auth.service';
import { AvatarId } from '../../shared/models/user.model';
import { AVATAR_DEFAULT, avatarChoices, avatarPresetUrl } from '../../shared/avatar-presets';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePageComponent implements OnInit {
  private readonly auth = inject(AuthService);
  readonly currentUser = this.auth.currentUser;
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly previewAvatarId = signal<AvatarId>(AVATAR_DEFAULT);
  readonly avatarChoices = avatarChoices;
  readonly avatarPresetUrl = avatarPresetUrl;
  readonly form = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(24),
        Validators.pattern(/^[a-zA-Z0-9_]+$/),
      ],
    }),
    visibility: new FormControl<'public' | 'private'>('public', { nonNullable: true }),
    avatarId: new FormControl<AvatarId>(AVATAR_DEFAULT, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.error.set('');
    this.success.set('');
    this.loading.set(true);
    this.auth.profile().subscribe({
      next: (user) => {
        const avatarId = user.avatarId || AVATAR_DEFAULT;
        this.form.setValue({ username: user.username, visibility: user.visibility, avatarId });
        this.previewAvatarId.set(avatarId);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(apiErrorMessage(error, 'Impossible de charger le profil.'));
        this.loading.set(false);
      },
    });
  }

  previewAvatar(avatarId: AvatarId): void {
    this.previewAvatarId.set(avatarId);
    this.form.controls.avatarId.setValue(avatarId);
  }

  save(): void {
    this.error.set('');
    this.success.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Vérifiez le pseudo : il doit contenir entre 3 et 24 lettres, chiffres ou _.');
      return;
    }

    this.saving.set(true);
    const values = this.form.getRawValue();
    this.auth.update(values.username.trim(), values.visibility, this.previewAvatarId()).subscribe({
      next: (user) => {
        const avatarId = user.avatarId || AVATAR_DEFAULT;
        this.previewAvatarId.set(avatarId);
        this.form.controls.avatarId.setValue(avatarId);
        this.success.set('Votre profil a été enregistré.');
        this.saving.set(false);
      },
      error: (error: unknown) => {
        this.error.set(apiErrorMessage(error, 'Impossible d’enregistrer le profil. Vérifiez votre connexion puis réessayez.'));
        this.saving.set(false);
      },
    });
  }
}
