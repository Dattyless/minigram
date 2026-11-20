import { Component, inject, signal } from '@angular/core';
import { CreatePost } from '../../components/create-post/create-post';
import { Post as PostCard } from '../../components/post/post';
import { Post } from '../../models/post.model';
import { RestApiService } from '../../services/rest-api.service';

// Página principal: pide los posts al backend y los guarda en un signal.
@Component({
  selector: 'app-home',
  imports: [PostCard, CreatePost],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  public restApiService = inject(RestApiService);

  readonly posts = signal<Post[]>([]);

  constructor() {
    // Sin sesión no se pide el feed: el contenido no debe cargarse.
    if (this.restApiService.isLoggedIn()) {
      this.loadPosts();
    }
  }

  // El componente create-post avisa aquí cuando ha publicado algo.
  onPostCreated(): void {
    this.loadPosts();
  }

  // Al borrar un post lo quito del feed sin volver a pedirlo todo.
  onPostDeleted(postId: number): void {
    this.posts.update((posts) => posts.filter((post) => post.id !== postId));
  }

  loadPosts(): void {
    this.restApiService.listPosts().subscribe({
      next: ({ posts }) => this.posts.set(posts),
      error: (error) => {
        console.error('Error al cargar el feed', error);

        // Si el token ha caducado, cerramos la sesión para ocultar el contenido.
        if (error.status === 401) {
          this.restApiService.logout();
          this.posts.set([]);
        }
      },
    });
  }
}
