import '@angular/compiler';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { AuthService } from './auth.service';

TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

const localStorageMock = () => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock(),
  configurable: true,
});

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('login() uses POST /api/auth/login with the right body', () => {
    const user = { id: '1', name: 'Demo', email: 'demo@example.com', createdAt: '2024-01-01' };

    service.login('demo@example.com', 'Demo1234!').subscribe((response) => {
      expect(response.token).toBe('jwt-token');
      expect(response.user).toEqual(user);
      expect(localStorage.getItem('gpc_token')).toBe('jwt-token');
    });

    const request = httpMock.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'demo@example.com',
      password: 'Demo1234!',
    });

    request.flush({ token: 'jwt-token', user });
  });
});
