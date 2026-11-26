import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Page } from '../models/page.model';
import { Recommendation, RecommendationDraft } from '../models/recommendation.model';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly http = inject(HttpClient);

  list(search = '', page = 1, limit = 10, author = '', authorId = '') {
    return this.http.get<Page<Recommendation>>('/api/recommendations', {
      params: { q: search, author, authorId, page, limit },
    });
  }

  create(draft: RecommendationDraft) {
    return this.http.post<Recommendation>('/api/recommendations', this.toFormData(draft));
  }

  update(id: string, draft: RecommendationDraft) {
    return this.http.put<Recommendation>(`/api/recommendations/${id}`, this.toFormData(draft));
  }

  delete(id: string) {
    return this.http.delete<void>(`/api/recommendations/${id}`);
  }

  image(id: string) {
    return this.http.get(`/api/recommendations/${id}/image`, { responseType: 'blob' });
  }

  private toFormData(draft: RecommendationDraft): FormData {
    const body = new FormData();
    body.append('animeTitle', draft.animeTitle);
    body.append('rating', String(draft.rating));
    body.append('comment', draft.comment);
    body.append('seasonOrVolume', draft.seasonOrVolume);
    if (draft.image) body.append('image', draft.image);
    if (draft.removeImage) body.append('removeImage', 'true');
    return body;
  }
}
