import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Post as PostModel } from '../../models/post.model';
import { RestApiService } from '../../services/rest-api.service';
import { Comments } from '../comments/comments';

// Componente que muestra un único post dentro de una tarjeta de Angular Material.
@Component({
  selector: 'app-post',
  imports: [MatCardModule, MatButtonModule, MatIconModule, Comments],
  templateUrl: './post.html',
  styleUrl: './post.css',
})
export class Post {
  private readonly api = inject(RestApiService);

  // Home le pasa el post con [post]="post".
  readonly post = input<PostModel>();

  // Construyo la URL de la imagen a partir del nombre guardado en la base de datos.
  readonly imageUrl = computed(() => {
    const post = this.post();
    return post ? this.api.imageUrl(post.image_filename) : '';
  });

  // URL de la foto de perfil del autor (si tiene).
  readonly avatarUrl = computed(() => {
    const post = this.post();
    return post?.avatar_filename ? this.api.imageUrl(post.avatar_filename) : '';
  });

  // Avisa al padre con el id del post borrado para que lo quite del feed.
  readonly postDeleted = output<number>();

  readonly liked = signal(false);
  readonly likeCount = signal(0);
  readonly liking = signal(false);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  constructor() {
    // Cuando aparece el post, cargo sus likes.
    effect(() => {
      const post = this.post();

      if (!post) {
        return;
      }

      // doIlike dice si he dado like y countLike devuelve el total.
      forkJoin([
        this.api.doILike(post.id),
        this.api.countLike(post.id),
      ]).subscribe({
        next: ([likeResult, countResult]) => {
          this.liked.set(likeResult.liked);
          this.likeCount.set(countResult.count);
        },
        error: (error) => console.error('Error al cargar los likes', error),
      });
    });
  }

  deletePost(): void {
    const post = this.post();

    if (!post || this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.deleteError.set(null);

    this.api.deletePost(post.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.postDeleted.emit(post.id);
      },
      error: (error: unknown) => {
        this.deleting.set(false);
        this.deleteError.set(this.deleteErrorMessage(error));
      },
    });
  }

  private deleteErrorMessage(error: unknown): string {
    if (typeof error !== 'object' || error === null || !('status' in error)) {
      return 'No se ha podido borrar el post. Inténtalo otra vez.';
    }

    switch (error.status) {
      case 401:
        return 'Tu sesión ha caducado. Inicia sesión de nuevo.';
      case 403:
        return 'No puedes borrar este post.';
      case 404:
        return 'Este post ya no existe.';
      default:
        return 'No se ha podido borrar el post. Inténtalo otra vez.';
    }
  }

  toggleLike(): void {
    const post = this.post();

    if (!post || this.liking()) {
      return;
    }

    this.liking.set(true);

    this.api.toggleLike(post.id).subscribe({
      next: ({ liked, count }) => {
        this.liked.set(liked);
        this.likeCount.set(count);
        this.liking.set(false);
      },
      error: (error) => {
        console.error('Error al cambiar el like', error);
        this.liking.set(false);
      },
    });
  }
}
