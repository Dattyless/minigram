import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RestApiService } from './rest-api.service';

describe('RestApiService', () => {
  let service: RestApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(RestApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  // Compruebo que el servicio llama a la URL correcta y que devuelve
  // el array de posts que manda el backend.
  it('should load the feed', () => {
    service.listPosts().subscribe((response) => {
      expect(response.posts.length).toBe(1);
    });

    const req = httpTesting.expectOne('http://localhost:3000/posts/feed');
    req.flush({
      posts: [
        {
          id: 1,
          caption: 'Hola',
          image_filename: 'foto.png',
          username: 'ana',
        },
      ],
    });
  });

  // Compruebo que el nombre del archivo se convierte en la URL que usa el <img>.
  it('should build the image url', () => {
    expect(service.imageUrl('foto.png')).toBe('http://localhost:3000/uploads/foto.png');
  });
});
