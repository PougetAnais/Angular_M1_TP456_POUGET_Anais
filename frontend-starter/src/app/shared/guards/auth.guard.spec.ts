import '@angular/compiler';
import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

describe('authGuard', () => {
  it('redirects a user without a token to /login', () => {
    const createUrlTree = vi.fn().mockReturnValue({ url: '/login' });

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            token: () => null,
          },
        },
        {
          provide: Router,
          useValue: {
            createUrlTree,
          },
        },
      ],
    });

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toEqual({ url: '/login' });
  });
});
