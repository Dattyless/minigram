import { Component, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RestApiService } from '../../services/rest-api.service';

interface NewPost {
  caption: string;
}

@Component({
  selector: 'app-create-post',
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, FormField],
  templateUrl: './create-post.html',
  styleUrl: './create-post.css',
})
export class CreatePost {
  private readonly api = inject(RestApiService);
  private readonly imageInput = viewChild<ElementRef<HTMLInputElement>>('imageInput');

  // Avisa al padre (home) para que vuelva a cargar el feed.
  readonly postCreated = output<void>();

  protected readonly newPost = signal<NewPost>({ caption: '' });
  protected readonly createForm = form(this.newPost, (p) => {
    required(p.caption, { message: 'Debes escribir una descripción' });
  });

  protected readonly image = signal<File | null>(null);
  protected readonly imageError = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.image.set(input.files?.[0] ?? null);

    if (this.image()) {
      this.imageError.set(null);
    }
  }

  protected submit(event: Event): void {
    event.preventDefault();

    this.imageError.set(null);
    this.errorMessage.set(null);

    const file = this.image();
    if (!file) {
      this.imageError.set('Selecciona una imagen');
    }

    if (this.createForm().invalid()) {
      this.createForm().markAsTouched();
    }

    if (!file || this.createForm().invalid()) {
      return;
    }

    this.loading.set(true);

    this.api.createPost(this.newPost().caption, file).subscribe({
      next: () => {
        this.loading.set(false);
        this.createForm().reset({ caption: '' });
        this.image.set(null);

        const input = this.imageInput();
        if (input) {
          input.nativeElement.value = '';
        }

        this.postCreated.emit();
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(
          this.isUnauthorized(error)
            ? 'Tu sesión ha caducado. Inicia sesión de nuevo.'
            : 'No se ha podido crear el post. Inténtalo otra vez.'
        );
      },
    });
  }

  private isUnauthorized(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      error.status === 401
    );
  }
}
