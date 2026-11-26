import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { LoginPageComponent } from './components/login-page/login-page';
import { ProfilePageComponent } from './components/profile-page/profile-page';
import { RegisterPageComponent } from './components/register-page/register-page';
import { RecommendationsPageComponent } from './components/recommendations-page/recommendations-page';
import { TracksPageComponent } from './components/tracks-page/tracks-page';
import { UserProfilePageComponent } from './components/user-profile-page/user-profile-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'recommendations' },
  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterPageComponent },
  { path: 'profile/settings', component: ProfilePageComponent, canActivate: [authGuard] },
  { path: 'profile', component: UserProfilePageComponent, canActivate: [authGuard] },
  { path: 'users/:id', component: UserProfilePageComponent },
  { path: 'recommendations', component: RecommendationsPageComponent },
  { path: 'tracks', component: TracksPageComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'recommendations' },
];
