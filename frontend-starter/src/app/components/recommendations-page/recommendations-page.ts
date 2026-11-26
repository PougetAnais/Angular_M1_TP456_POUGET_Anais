import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../shared/utils/api-error-message';
import { avatarPresetUrl } from '../../shared/avatar-presets';
import { Recommendation } from '../../shared/models/recommendation.model';
import { RecommendationService } from '../../shared/services/recommendation.service';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './recommendations-page.html',
  styleUrl: './recommendations-page.css',
})
export class RecommendationsPageComponent implements OnInit, OnDestroy {
  private readonly service = inject(RecommendationService);

  readonly recommendations = signal<Recommendation[]>([]);
  readonly imageSources = signal<Record<string, string>>({});
  readonly page = signal(1);
  readonly pages = signal(1);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly animeSearch = new FormControl('', { nonNullable: true });
  readonly authorSearch = new FormControl('', { nonNullable: true });

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    for (const source of Object.values(this.imageSources())) URL.revokeObjectURL(source);
  }

  load(page = this.page()): void {
    this.loading.set(true);
    this.error.set('');
    this.service.list(this.animeSearch.value.trim(), page, 10, this.authorSearch.value.trim()).subscribe({
      next: (result) => {
        this.recommendations.set(result.items);
        this.page.set(result.page);
        this.pages.set(result.pages);
        this.total.set(result.total);
        this.loading.set(false);
        this.loadImages(result.items);
      },
      error: (error: unknown) => {
        console.error('[RecommendationsPage] Chargement du fil impossible', error);
        this.error.set(apiErrorMessage(error, 'Impossible de charger le fil d’actualité.'));
        this.loading.set(false);
      },
    });
  }

  searchFeed(): void {
    this.page.set(1);
    this.load(1);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.pages() || this.loading()) return;
    this.load(page);
  }

  avatarHref(id: Recommendation['author']['avatarId']): string {
    return avatarPresetUrl(id);
  }

  imageFor(recommendation: Recommendation): string | null {
    return this.imageSources()[recommendation.id] ?? null;
  }

  private loadImages(items: Recommendation[]): void {
    const currentIds = new Set(items.filter((item) => item.imageUrl).map((item) => item.id));
    const next = { ...this.imageSources() };
    for (const [id, source] of Object.entries(next)) {
      if (!currentIds.has(id)) {
        URL.revokeObjectURL(source);
        delete next[id];
      }
    }
    this.imageSources.set(next);
    for (const item of items) {
      if (!item.imageUrl || this.imageSources()[item.id]) continue;
      this.service.image(item.id).subscribe({
        next: (blob) => this.imageSources.update((sources) => ({ ...sources, [item.id]: URL.createObjectURL(blob) })),
        error: (error: unknown) => console.error('[RecommendationsPage] Image de recommandation indisponible', error),
      });
    }
  }
}
