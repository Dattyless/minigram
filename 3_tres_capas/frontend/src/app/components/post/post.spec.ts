import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Post } from './post';

describe('Post', () => {
  let component: Post;
  let fixture: ComponentFixture<Post>;

  beforeEach(async () => {
    // Post inyecta RestApiService, que a su vez usa HttpClient, por eso
    // registro aquí el cliente HTTP de pruebas.
    await TestBed.configureTestingModule({
      imports: [Post],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Post);
    component = fixture.componentInstance;

    // El input "post" es obligatorio, así que lo relleno antes de renderizar.
    fixture.componentRef.setInput('post', {
      id: 1,
      caption: 'Mi primera publicación',
      image_filename: 'foto.png',
      username: 'ana',
    });

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the author and caption', () => {
    expect(fixture.nativeElement.textContent).toContain('ana');
    expect(fixture.nativeElement.textContent).toContain('Mi primera publicación');
  });

  it('should render the delete button in the header', () => {
    const button = fixture.nativeElement.querySelector(
      '.post-header-actions button[aria-label="Borrar publicación de ana"]'
    );
    expect(button).toBeTruthy();
  });
});
