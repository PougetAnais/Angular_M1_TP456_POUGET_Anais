import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { FriendUser } from '../../shared/models/friend.model';
import { FriendService } from '../../shared/services/friend.service';
import { apiErrorMessage } from '../../shared/utils/api-error-message';
import { avatarPresetUrl } from '../../shared/avatar-presets';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './friends-page.html',
  styleUrl: './friends-page.css',
})
export class FriendsPageComponent implements OnInit {
  private readonly api = inject(FriendService);
  readonly avatarPresetUrl = avatarPresetUrl;
  readonly view = signal<'friends' | 'requests'>('friends');
  readonly friends = signal<FriendUser[]>([]);
  readonly requests = signal<FriendUser[]>([]);
  readonly results = signal<FriendUser[]>([]);
  readonly query = new FormControl('', { nonNullable: true });
  readonly loading = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  ngOnInit(): void {
    this.loadFriends();
    this.loadRequests();
    this.query.valueChanges.pipe(debounceTime(250), distinctUntilChanged()).subscribe((value) => this.search(value));
  }

  showFriends(): void { this.view.set('friends'); this.error.set(''); this.success.set(''); }
  showRequests(): void { this.view.set('requests'); this.error.set(''); this.success.set(''); }

  loadFriends(): void {
    this.loading.set(true);
    this.api.friends().subscribe({
      next: ({ items }) => { this.friends.set(items); this.loading.set(false); },
      error: (error: unknown) => { this.error.set(apiErrorMessage(error, 'Impossible de charger vos amis.')); this.loading.set(false); },
    });
  }

  loadRequests(): void {
    this.api.requests().subscribe({
      next: ({ items }) => this.requests.set(items),
      error: (error: unknown) => this.error.set(apiErrorMessage(error, 'Impossible de charger les demandes reçues.')),
    });
  }

  search(value: string): void {
    const query = value.trim();
    if (query.length < 2) { this.results.set([]); return; }
    this.api.search(query).subscribe({
      next: ({ items }) => this.results.set(items),
      error: (error: unknown) => this.error.set(apiErrorMessage(error, 'La recherche a échoué.')),
    });
  }

  send(user: FriendUser): void {
    this.api.sendRequest(user.id).subscribe({
      next: () => { this.success.set(`Demande envoyée à @${user.username}.`); this.search(this.query.value); },
      error: (error: unknown) => this.error.set(apiErrorMessage(error, 'Impossible d’envoyer la demande.')),
    });
  }

  accept(user: FriendUser): void {
    if (!user.requestId) return;
    this.api.accept(user.requestId).subscribe({
      next: () => { this.success.set(`@${user.username} a été ajouté à vos amis.`); this.loadFriends(); this.loadRequests(); },
      error: (error: unknown) => this.error.set(apiErrorMessage(error, 'Impossible d’accepter cette demande.')),
    });
  }

  decline(user: FriendUser): void {
    if (!user.requestId) return;
    this.api.removeRequest(user.requestId).subscribe({
      next: () => { this.success.set('Demande supprimée.'); this.loadRequests(); },
      error: (error: unknown) => this.error.set(apiErrorMessage(error, 'Impossible de supprimer cette demande.')),
    });
  }

  removeFriend(user: FriendUser): void {
    if (!window.confirm(`Retirer @${user.username} de vos amis ?`)) return;
    this.api.removeFriend(user.id).subscribe({
      next: () => { this.success.set(`@${user.username} a été retiré de vos amis.`); this.loadFriends(); },
      error: (error: unknown) => this.error.set(apiErrorMessage(error, 'Impossible de retirer cet ami.')),
    });
  }
}
