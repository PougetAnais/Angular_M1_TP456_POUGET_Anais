import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { AVATAR_DEFAULT, avatarPresetUrl } from '../../shared/avatar-presets';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly menuOpen = signal(false);
  readonly avatarHref = computed(() =>
    avatarPresetUrl(this.auth.currentUser()?.avatarId ?? AVATAR_DEFAULT),
  );
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (this.auth.token() && !this.auth.currentUser()) {
      this.auth.profile().subscribe({
        next: (user) => console.debug('[App] Session restaurée', user.id),
        error: (error: unknown) => console.error('[App] Restauration de session impossible', error),
      });
    }
  }

  toggleMenu(): void {
    this.menuOpen.update((isOpen) => !isOpen);
  }

  editProfile(): void {
    this.menuOpen.set(false);
    void this.router.navigateByUrl('/profile');
  }

  logout(): void {
    this.menuOpen.set(false);
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
