import '@angular/compiler';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { FriendService } from './friend.service';

TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

describe('FriendService', () => {
  let service: FriendService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(FriendService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('recherche des membres et envoie une demande au profil choisi', () => {
    service.search('ana').subscribe(({ items }) => expect(items[0].username).toBe('anais'));
    const search = http.expectOne((request) => request.url === '/api/users/search' && request.params.get('q') === 'ana');
    expect(search.request.method).toBe('GET');
    search.flush({ items: [{ id: 'user-1', memberId: '#0001', username: 'anais', avatarId: 'animal-cat', visibility: 'public', relationship: 'none' }] });

    service.sendRequest('user-1').subscribe((result) => expect(result.state).toBe('sent'));
    const send = http.expectOne('/api/friends/requests/user-1');
    expect(send.request.method).toBe('POST');
    send.flush({ id: 'request-1', state: 'sent' });
  });
});
