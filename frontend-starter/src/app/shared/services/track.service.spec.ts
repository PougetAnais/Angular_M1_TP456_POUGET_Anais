import '@angular/compiler';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { TrackService } from './track.service';

TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

describe('TrackService', () => {
  let service: TrackService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(TrackService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('list() transmits page and limit query parameters', () => {
    service.list(2, 10).subscribe((response) => {
      expect(response.page).toBe(2);
      expect(response.limit).toBe(10);
      expect(response.items).toEqual([]);
    });

    const request = httpMock.expectOne((request) => {
      return request.url === '/api/tracks'
        && request.params.get('page') === '2'
        && request.params.get('limit') === '10';
    });

    expect(request.request.method).toBe('GET');
    request.flush({ items: [], page: 2, limit: 10, total: 0, pages: 1 });
  });

  it('upload() uses multipart form data and exposes progress events', () => {
    const file = new File(['demo'], 'demo.mp3', { type: 'audio/mpeg' });

    service.upload(file, 'Demo track').subscribe((event) => {
      if (event.type === HttpEventType.UploadProgress) {
        expect(event.loaded).toBe(50);
        expect(event.total).toBe(100);
      }

      if (event instanceof HttpResponse) {
        expect(event.status).toBe(201);
        expect(event.body).toEqual({
          id: 't-1',
          title: 'Demo track',
          originalName: 'demo.mp3',
          mimeType: 'audio/mpeg',
          size: 4,
          createdAt: '2024-01-01T00:00:00.000Z',
        });
      }
    });

    const request = httpMock.expectOne('/api/tracks');
    expect(request.request.method).toBe('POST');
    expect(request.request.reportProgress).toBeTruthy();
    expect(request.request.responseType).toBe('json');

    const formData = request.request.body as FormData;
    expect(formData.get('title')).toBe('Demo track');
    expect(formData.get('audio')).toBe(file);

    request.event({
      type: HttpEventType.UploadProgress,
      loaded: 50,
      total: 100,
    } as any);

    request.flush({
      id: 't-1',
      title: 'Demo track',
      originalName: 'demo.mp3',
      mimeType: 'audio/mpeg',
      size: 4,
      createdAt: '2024-01-01T00:00:00.000Z',
    }, { status: 201, statusText: 'Created' });
  });

  it('deleteTrack() calls DELETE /api/tracks/:id', () => {
    service.deleteTrack('track-42').subscribe((response) => {
      expect(response).toBeNull();
    });

    const request = httpMock.expectOne('/api/tracks/track-42');
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
