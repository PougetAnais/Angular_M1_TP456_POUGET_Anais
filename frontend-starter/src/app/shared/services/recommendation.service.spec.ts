import '@angular/compiler';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { RecommendationService } from './recommendation.service';

TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

describe('RecommendationService', () => {
  let service: RecommendationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(RecommendationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('list() envoie recherche et pagination', () => {
    service.list('Naruto', 2, 10, 'anais').subscribe((response) => {
      expect(response.total).toBe(1);
      expect(response.items[0].animeTitle).toBe('Naruto');
    });
    const request = httpMock.expectOne((req) =>
      req.url === '/api/recommendations'
      && req.params.get('q') === 'Naruto'
      && req.params.get('author') === 'anais'
      && req.params.get('authorId') === ''
      && req.params.get('page') === '2'
      && req.params.get('limit') === '10');
    expect(request.request.method).toBe('GET');
    request.flush({
      items: [{ id: 'r-1', animeTitle: 'Naruto', rating: 9, comment: '', seasonOrVolume: '', imageUrl: null, createdAt: '2026-01-01', updatedAt: '2026-01-01', author: { id: 'u-1', username: 'demo', avatarId: 'animal-cat' }, isOwner: false }],
      page: 2, limit: 10, total: 1, pages: 1,
    });
  });

  it('create() transmet les champs et l’image en multipart', () => {
    const image = new File(['cover'], 'cover.jpg', { type: 'image/jpeg' });
    service.create({ animeTitle: 'Naruto', rating: 8.5, comment: 'Très bon', seasonOrVolume: 'Saison 1', image }).subscribe();
    const request = httpMock.expectOne('/api/recommendations');
    expect(request.request.method).toBe('POST');
    const body = request.request.body as FormData;
    expect(body.get('animeTitle')).toBe('Naruto');
    expect(body.get('rating')).toBe('8.5');
    expect(body.get('comment')).toBe('Très bon');
    expect(body.get('seasonOrVolume')).toBe('Saison 1');
    expect(body.get('image')).toBe(image);
    request.flush({});
  });

  it('update(), delete() et image() appellent les routes correspondantes', () => {
    service.update('r-1', { animeTitle: 'Naruto Shippuden', rating: 9, comment: '', seasonOrVolume: '', image: null, removeImage: true }).subscribe();
    const updateRequest = httpMock.expectOne('/api/recommendations/r-1');
    expect(updateRequest.request.method).toBe('PUT');
    expect((updateRequest.request.body as FormData).get('removeImage')).toBe('true');
    updateRequest.flush({});

    service.image('r-1').subscribe((image) => expect(image.size).toBe(5));
    const imageRequest = httpMock.expectOne('/api/recommendations/r-1/image');
    expect(imageRequest.request.responseType).toBe('blob');
    imageRequest.flush(new Blob(['cover'], { type: 'image/jpeg' }));

    service.delete('r-1').subscribe();
    const deleteRequest = httpMock.expectOne('/api/recommendations/r-1');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);
  });
});
