import '@angular/compiler';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { AuthService } from './auth.service';

TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

const localStorageMock = () => {
  const store = new Map<string, string>();
  return { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value), removeItem: (key: string) => store.delete(key), clear: () => store.clear() };
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock(), configurable: true });

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const user = { id: '1', name: 'demo', username: 'demo', email: 'demo@example.com', visibility: 'public' as const, avatarId: 'animal-cat' as const, createdAt: '2024-01-01' };

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });
  afterEach(() => httpMock.verify());

  it('register() sends account details and the chosen icon as JSON', () => {
    service.register('demo', 'demo@example.com', 'password123', 'password123', 'public', 'animal-cat').subscribe((response) => {
      expect(response.user).toEqual(user);
      expect(service.currentUser()?.avatarId).toBe('animal-cat');
    });
    const request = httpMock.expectOne('/api/auth/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ username: 'demo', email: 'demo@example.com', password: 'password123', passwordConfirmation: 'password123', visibility: 'public', avatarId: 'animal-cat' });
    request.flush({ token: 'jwt-token', user });
  });

  it('update() saves profile fields and selected icon', () => {
    const updated = { ...user, username: 'demo2', name: 'demo2', visibility: 'private' as const, avatarId: 'fruit-orange' as const };
    service.update('demo2', 'private', 'fruit-orange').subscribe((result) => expect(result).toEqual(updated));
    const request = httpMock.expectOne('/api/users/me');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ username: 'demo2', visibility: 'private', avatarId: 'fruit-orange' });
    request.flush(updated);
    expect(service.currentUser()?.avatarId).toBe('fruit-orange');
  });
});
