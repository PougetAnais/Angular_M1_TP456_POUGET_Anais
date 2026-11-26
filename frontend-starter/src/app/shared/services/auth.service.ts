import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { AuthResponse } from '../models/auth-response.model';
import { AvatarId, User } from '../models/user.model';
import { UserProfile } from '../models/user-profile.model';

/** Handles authentication and the current user's profile. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly currentUser = signal<User | null>(null);
  readonly token = signal<string | null>(localStorage.getItem('gpc_token'));

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>('/api/auth/login', { email, password })
      .pipe(tap((response) => this.storeAuthentication(response)));
  }

  register(
    username: string,
    email: string,
    password: string,
    passwordConfirmation: string,
    visibility: 'public' | 'private',
    avatarId: AvatarId,
  ) {
    return this.http
      .post<AuthResponse>('/api/auth/register', { username, email, password, passwordConfirmation, visibility, avatarId })
      .pipe(tap((response) => this.storeAuthentication(response)));
  }

  profile() {
    return this.http
      .get<User>('/api/users/me')
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  userProfile(id: string) {
    return this.http.get<UserProfile>(`/api/users/${id}`);
  }

  update(username: string, visibility: 'public' | 'private', avatarId: AvatarId) {
    return this.http
      .put<User>('/api/users/me', { username, visibility, avatarId })
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  logout(): void {
    localStorage.removeItem('gpc_token');
    this.token.set(null);
    this.currentUser.set(null);
  }

  private storeAuthentication(response: AuthResponse): void {
    localStorage.setItem('gpc_token', response.token);
    this.token.set(response.token);
    this.currentUser.set(response.user);
  }
}
