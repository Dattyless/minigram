import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    // Home solo pide el feed si hay sesión iniciada.
    localStorage.setItem('jwt_token', 'test-token');
    localStorage.setItem('username', 'ana');

    // Home pide el feed en el constructor, así que en el test necesito
    // registrar HttpClient y su versión de pruebas para simular la respuesta.
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);

    // Simulo que el backend responde con una lista vacía.
    httpTesting.expectOne('http://localhost:3000/posts/feed').flush({ posts: [] });

    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('username');
    httpTesting.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render an empty feed message', () => {
    expect(fixture.nativeElement.textContent).toContain('No hay elementos disponibles');
  });
});
