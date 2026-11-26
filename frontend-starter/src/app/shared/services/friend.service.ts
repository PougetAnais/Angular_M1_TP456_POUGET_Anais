import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FriendUser, FriendshipStatus } from '../models/friend.model';

@Injectable({ providedIn: 'root' })
export class FriendService {
  private readonly http = inject(HttpClient);

  friends() {
    return this.http.get<{ items: FriendUser[] }>('/api/friends');
  }

  requests(direction: 'incoming' | 'outgoing' = 'incoming') {
    return this.http.get<{ items: FriendUser[] }>('/api/friends/requests', { params: new HttpParams().set('direction', direction) });
  }

  search(query: string) {
    return this.http.get<{ items: FriendUser[] }>('/api/users/search', { params: new HttpParams().set('q', query) });
  }

  status(userId: string) {
    return this.http.get<FriendshipStatus>(`/api/friends/status/${userId}`);
  }

  sendRequest(userId: string) {
    return this.http.post<{ id: string; state: 'sent' }>(`/api/friends/requests/${userId}`, {});
  }

  accept(requestId: string) {
    return this.http.post<{ id: string; state: 'friends' }>(`/api/friends/requests/${requestId}/accept`, {});
  }

  removeRequest(requestId: string) {
    return this.http.delete<void>(`/api/friends/requests/${requestId}`);
  }

  removeFriend(userId: string) {
    return this.http.delete<void>(`/api/friends/${userId}`);
  }
}
