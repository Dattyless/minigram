import { Component, effect, inject, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Comment } from '../../models/comment.model';
import { RestApiService } from '../../services/rest-api.service';

// Lista y crea los comentarios de un post concreto.
@Component({
  imports: [MatIconModule],
  selector: 'app-comments',
  styleUrl: './comments.css',
  templateUrl: './comments.html',
})
export class Comments {
  protected readonly api = inject(RestApiService);

  // El post que se está mostrando. Home -> Post -> Comments.
  readonly postId = input.required<number>();

  readonly comments = signal<Comment[]>([]);
  readonly newComment = signal('');
  readonly loading = signal(false);
  readonly sending = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Solo se pueden borrar los comentarios propios.
  readonly currentUsername = this.api.getUsername();

  constructor() {
    // Cuando cambia el post (o después de iniciar sesión), recarga sus comentarios.
    effect(() => {
      const postId = this.postId();

      if (!this.api.isLoggedIn()) {
        this.comments.set([]);
        return;
      }

      this.loadComments(postId);
    });
  }

  loadComments(postId: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.api.listComments(postId).subscribe({
      next: (comments) => {
        this.comments.set(comments);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar los comentarios', error);
        this.loading.set(false);
        this.errorMessage.set('No se han podido cargar los comentarios');
      },
    });
  }

  updateNewComment(event: Event): void {
    this.newComment.set((event.target as HTMLInputElement).value);
  }

  addComment(event: Event): void {
    event.preventDefault();

    const content = this.newComment().trim();

    if (!content || this.sending()) {
      return;
    }

    this.sending.set(true);
    this.errorMessage.set(null);

    this.api.createComment(this.postId(), content).subscribe({
      next: (comment) => {
        this.comments.update((comments) => [...comments, comment]);
        this.newComment.set('');
        this.sending.set(false);
      },
      error: (error) => {
        console.error('Error al crear el comentario', error);
        this.sending.set(false);
        this.errorMessage.set('No se ha podido publicar el comentario');
      },
    });
  }

  deleteComment(commentId: number): void {
    this.errorMessage.set(null);

    this.api.deleteComment(commentId).subscribe({
      next: () => {
        this.comments.update((comments) =>
          comments.filter((comment) => comment.id !== commentId)
        );
      },
      error: (error) => {
        console.error('Error al borrar el comentario', error);
        this.errorMessage.set('No se ha podido borrar el comentario');
      },
    });
  }
}
