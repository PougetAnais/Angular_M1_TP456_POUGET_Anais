import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Track } from '../../shared/models/track.model';
import { TrackService } from '../../shared/services/track.service';

@Component({
  imports: [ReactiveFormsModule],
  templateUrl: './tracks-page.html',
  styleUrl: './tracks-page.css',
})
export class TracksPageComponent {
  private readonly service = inject(TrackService);

  readonly tracks = signal<Track[]>([]);
  readonly page = signal(1);
  readonly pages = signal(1);
  readonly loading = signal(false);
  readonly deletingTracks = signal<Record<string, boolean>>({});
  readonly uploadProgress = signal(0);
  readonly uploadState = signal<'idle' | 'uploading' | 'success' | 'error'>('idle');
  readonly snackbarMessage = signal('');
  readonly snackbarType = signal<'success' | 'error'>('success');
  readonly snackbarVisible = signal(false);
  readonly title = new FormControl('', { nonNullable: true });
  file?: File;

  constructor() {
    this.load();
  }

  choose(event: Event): void {
    if (this.uploadState() === 'uploading') return;
    this.file = (event.target as HTMLInputElement).files?.[0];
    console.debug('[TracksPage] Fichier sélectionné', this.file?.name);
  }

  private showSnackbar(message: string, type: 'success' | 'error'): void {
    this.snackbarMessage.set(message);
    this.snackbarType.set(type);
    this.snackbarVisible.set(true);

    window.setTimeout(() => this.snackbarVisible.set(false), 3000);
  }

  load(): void {
    this.loading.set(true);
    this.service.list(this.page()).subscribe({
      next: (response) => {
        console.debug('[TracksPage] Pistes chargées', response.items.length);
        this.tracks.set(response.items);
        this.pages.set(response.pages || 1);
        this.loading.set(false);

        if (this.page() > response.pages && response.pages > 0) {
          this.page.set(response.pages);
        }
      },
      error: (error) => {
        console.error('[TracksPage] Chargement impossible', error);
        this.loading.set(false);
        this.showSnackbar('Impossible de charger les pistes.', 'error');
      },
    });
  }

  go(page: number): void {
    if (page < 1 || page > this.pages()) return;
    this.page.set(page);
    this.load();
  }

  delete(track: Track): void {
    if (!window.confirm(`Supprimer ${track.title} ?`)) {
      return;
    }

    const pending = { ...this.deletingTracks() };
    pending[track.id] = true;
    this.deletingTracks.set(pending);

    this.service.delete(track.id).subscribe({
      next: () => {
        const remaining = { ...this.deletingTracks() };
        delete remaining[track.id];
        this.deletingTracks.set(remaining);
        this.showSnackbar(`"${track.title}" a été supprimée.`, 'success');
        this.page.set(Math.max(1, this.page()));
        this.load();
      },
      error: (error) => {
        const remaining = { ...this.deletingTracks() };
        delete remaining[track.id];
        this.deletingTracks.set(remaining);
        const message = error?.error?.message || 'La piste n’a pas pu être supprimée.';
        console.error('[TracksPage] Suppression impossible', error);
        this.showSnackbar(message, 'error');
      },
    });
  }

  upload(): void {
    if (!this.file || this.uploadState() === 'uploading') return;

    const payload = this.title.value.trim() || this.file.name;
    this.uploadState.set('uploading');
    this.uploadProgress.set(0);

    this.service.upload(this.file, payload).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const percent = Math.round((event.loaded / event.total) * 100);
          this.uploadProgress.set(percent);
          return;
        }

        if (event instanceof HttpResponse) {
          this.uploadProgress.set(100);
          this.uploadState.set('success');
          this.showSnackbar('Import terminé avec succès.', 'success');
          this.title.setValue('');
          this.file = undefined;
          this.page.set(1);
          this.load();

          window.setTimeout(() => {
            this.uploadState.set('idle');
            this.uploadProgress.set(0);
          }, 1500);
        }
      },
      error: (error) => {
        this.uploadState.set('error');
        this.uploadProgress.set(0);
        const message = error?.error?.message || 'L’envoi a échoué.';
        console.error('[TracksPage] Envoi impossible', error);
        this.showSnackbar(message, 'error');
      },
    });
  }

}

