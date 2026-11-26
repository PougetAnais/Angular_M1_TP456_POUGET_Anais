import { Component, ElementRef, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { apiErrorMessage } from '../../shared/utils/api-error-message';
import { avatarPresetUrl } from '../../shared/avatar-presets';
import { Recommendation, RecommendationDraft } from '../../shared/models/recommendation.model';
import { UserProfile } from '../../shared/models/user-profile.model';
import { AvatarId } from '../../shared/models/user.model';
import { AuthService } from '../../shared/services/auth.service';
import { FriendService } from '../../shared/services/friend.service';
import { RelationshipState } from '../../shared/models/friend.model';
import { RecommendationService } from '../../shared/services/recommendation.service';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './user-profile-page.html',
  styleUrl: './user-profile-page.css',
})
export class UserProfilePageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly recommendationsApi = inject(RecommendationService);
  private readonly friendsApi = inject(FriendService);
  private routeSubscription?: Subscription;

  readonly profile = signal<UserProfile | null>(null);
  readonly isAuthenticated = this.auth.token;
  readonly friendship = signal<RelationshipState>('none');
  readonly friendshipRequestId = signal<string | null>(null);
  readonly recommendations = signal<Recommendation[]>([]);
  readonly imageSources = signal<Record<string, string>>({});
  readonly page = signal(1);
  readonly pages = signal(1);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly loadingReviews = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly editingId = signal<string | null>(null);
  readonly selectedImage = signal<File | null>(null);
  readonly imagePreview = signal<string | null>(null);
  readonly removeExistingImage = signal(false);
  readonly imageInput = viewChild<ElementRef<HTMLInputElement>>('profileImageInput');
  readonly avatarPresetUrl = avatarPresetUrl;

  readonly form = new FormGroup({
    animeTitle: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    rating: new FormControl<number | null>(8, { validators: [Validators.required, Validators.min(0), Validators.max(10)] }),
    comment: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(2000)] }),
    seasonOrVolume: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
  });

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const userId = params.get('id');
      if (userId) this.loadPublicProfile(userId);
      else this.loadOwnProfile();
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.releaseImages();
    this.releasePreview();
  }

  loadOwnProfile(): void {
    this.loading.set(true);
    this.error.set('');
    this.auth.profile().subscribe({
      next: (user) => {
        this.profile.set({
          id: user.id,
          memberId: user.memberId,
          username: user.username,
          visibility: user.visibility,
          avatarId: user.avatarId,
          createdAt: user.createdAt,
          email: user.email,
          isOwner: true,
        });
        this.loading.set(false);
        this.loadRecommendations(1);
      },
      error: (error: unknown) => {
        this.error.set(apiErrorMessage(error, 'Impossible de charger votre profil.'));
        this.loading.set(false);
      },
    });
  }

  loadPublicProfile(id: string): void {
    this.loading.set(true);
    this.error.set('');
    this.auth.userProfile(id).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loadFriendship(profile);
        this.loading.set(false);
        this.loadRecommendations(1);
      },
      error: (error: unknown) => {
        this.profile.set(null);
        this.recommendations.set([]);
        this.error.set(apiErrorMessage(error, 'Ce profil est introuvable ou privé.'));
        this.loading.set(false);
      },
    });
  }

  private loadFriendship(profile: UserProfile): void {
    if (profile.isOwner || !this.auth.token()) return;
    this.friendsApi.status(profile.id).subscribe({
      next: (status) => { this.friendship.set(status.state); this.friendshipRequestId.set(status.requestId); },
      error: (error: unknown) => console.error('[UserProfilePage] État de la relation indisponible', error),
    });
  }

  sendFriendRequest(): void {
    const profile = this.profile();
    if (!profile || profile.isOwner) return;
    this.friendsApi.sendRequest(profile.id).subscribe({
      next: () => { this.friendship.set('sent'); this.success.set(`Demande envoyée à @${profile.username}.`); },
      error: (error: unknown) => this.error.set(apiErrorMessage(error, 'Impossible d’envoyer la demande d’amitié.')),
    });
  }

  acceptFriendRequest(): void {
    const requestId = this.friendshipRequestId();
    if (!requestId) return;
    this.friendsApi.accept(requestId).subscribe({
      next: () => { this.friendship.set('friends'); this.friendshipRequestId.set(null); this.success.set('Cette personne a été ajoutée à vos amis.'); },
      error: (error: unknown) => this.error.set(apiErrorMessage(error, 'Impossible d’accepter cette demande.')),
    });
  }

  loadRecommendations(page = this.page()): void {
    const profile = this.profile();
    if (!profile) return;
    this.loadingReviews.set(true);
    this.recommendationsApi.list('', page, 10, '', profile.id).subscribe({
      next: (result) => {
        this.recommendations.set(result.items);
        this.page.set(result.page);
        this.pages.set(result.pages);
        this.total.set(result.total);
        this.loadingReviews.set(false);
        this.loadImages(result.items);
      },
      error: (error: unknown) => {
        this.error.set(apiErrorMessage(error, 'Impossible de charger les avis de ce profil.'));
        this.loadingReviews.set(false);
      },
    });
  }

  chooseImage(event: Event): void {
    this.error.set('');
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase()) && !ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
      this.error.set('Formats acceptés : JPG, PNG, WebP, GIF ou AVIF.');
      this.clearImage(input);
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      this.error.set('L’image doit faire 5 Mo maximum.');
      this.clearImage(input);
      return;
    }
    this.selectedImage.set(file);
    this.removeExistingImage.set(false);
    this.releasePreview();
    this.imagePreview.set(URL.createObjectURL(file));
  }

  clearImage(input?: HTMLInputElement): void {
    this.selectedImage.set(null);
    this.releasePreview();
    const element = input ?? this.imageInput()?.nativeElement;
    if (element) element.value = '';
  }

  toggleRemoveImage(event: Event): void {
    this.removeExistingImage.set((event.target as HTMLInputElement).checked);
  }

  editingRecommendation(): Recommendation | null {
    const id = this.editingId();
    return id ? this.recommendations().find((item) => item.id === id) ?? null : null;
  }

  edit(recommendation: Recommendation): void {
    if (!recommendation.isOwner) return;
    this.error.set('');
    this.success.set('');
    this.editingId.set(recommendation.id);
    this.form.setValue({
      animeTitle: recommendation.animeTitle,
      rating: recommendation.rating,
      comment: recommendation.comment,
      seasonOrVolume: recommendation.seasonOrVolume,
    });
    this.clearImage();
    this.removeExistingImage.set(false);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ animeTitle: '', rating: 8, comment: '', seasonOrVolume: '' });
    this.clearImage();
    this.removeExistingImage.set(false);
    this.error.set('');
  }

  submit(): void {
    const profile = this.profile();
    if (!profile?.isOwner) return;
    this.error.set('');
    this.success.set('');
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const values = this.form.getRawValue();
    const draft: RecommendationDraft = {
      animeTitle: values.animeTitle.trim(),
      rating: values.rating ?? -1,
      comment: values.comment.trim(),
      seasonOrVolume: values.seasonOrVolume.trim(),
      image: this.selectedImage(),
      removeImage: this.removeExistingImage(),
    };
    const id = this.editingId();
    this.saving.set(true);
    const request = id
      ? this.recommendationsApi.update(id, draft)
      : this.recommendationsApi.create(draft);
    request.subscribe({
      next: (saved) => {
        this.success.set(id ? 'Votre avis a été modifié.' : 'Votre avis a été publié.');
        this.saving.set(false);
        if (id) this.invalidateImage(id);
        this.cancelEdit();
        this.loadRecommendations(1);
        console.debug('[UserProfilePage] Recommandation enregistrée', saved.id);
      },
      error: (error: unknown) => {
        this.error.set(apiErrorMessage(error, 'Impossible d’enregistrer cet avis.'));
        this.saving.set(false);
      },
    });
  }

  delete(recommendation: Recommendation): void {
    if (!recommendation.isOwner || !window.confirm(`Supprimer l’avis « ${recommendation.animeTitle} » ?`)) return;
    this.recommendationsApi.delete(recommendation.id).subscribe({
      next: () => {
        this.success.set('Votre avis a été supprimé.');
        if (this.recommendations().length === 1 && this.page() > 1) this.page.update((page) => page - 1);
        this.loadRecommendations();
      },
      error: (error: unknown) => this.error.set(apiErrorMessage(error, 'Impossible de supprimer cet avis.')),
    });
  }

  imageFor(recommendation: Recommendation): string | null {
    return this.imageSources()[recommendation.id] ?? null;
  }

  private loadImages(items: Recommendation[]): void {
    const ids = new Set(items.filter((item) => item.imageUrl).map((item) => item.id));
    const sources = { ...this.imageSources() };
    for (const [id, source] of Object.entries(sources)) {
      if (!ids.has(id)) {
        URL.revokeObjectURL(source);
        delete sources[id];
      }
    }
    this.imageSources.set(sources);
    for (const item of items) {
      if (!item.imageUrl || this.imageSources()[item.id]) continue;
      this.recommendationsApi.image(item.id).subscribe({
        next: (image) => this.imageSources.update((current) => ({ ...current, [item.id]: URL.createObjectURL(image) })),
        error: (error: unknown) => console.error('[UserProfilePage] Image indisponible', error),
      });
    }
  }

  private invalidateImage(id: string): void {
    const source = this.imageSources()[id];
    if (!source) return;
    URL.revokeObjectURL(source);
    this.imageSources.update((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  private releaseImages(): void {
    for (const source of Object.values(this.imageSources())) URL.revokeObjectURL(source);
    this.imageSources.set({});
  }

  private releasePreview(): void {
    const preview = this.imagePreview();
    if (preview) URL.revokeObjectURL(preview);
    this.imagePreview.set(null);
  }
}
