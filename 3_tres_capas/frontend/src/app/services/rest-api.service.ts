import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Injectable, inject, signal } from '@angular/core';
import { Comment } from '../models/comment.model';
import { FeedResponse } from '../models/post.model';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RestApiService {

  private apiURL = 'http://localhost:3000';
  private http = inject(HttpClient);

  private jwtTokenKey = 'jwt_token';
  private usernameKey = 'username';

  public isLoggedIn = signal<boolean>(
    !!localStorage.getItem(this.jwtTokenKey)
  );

  // Pido el feed al backend enviando el token para que solo responda con sesión.
  listPosts(): Observable<FeedResponse> {
    const token = this.getToken();

    return this.http.get<FeedResponse>(this.apiURL + '/posts/feed', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  // Construyo la URL completa de la imagen.
  imageUrl(filename: string): string {
    return `${this.apiURL}/uploads/${filename}`;
  }

  // Devuelvo el nombre del usuario.
  getUsername(): string {
    return localStorage.getItem(this.usernameKey) || '';
  }

  // Devuelvo el token JWT.
  getToken(): string {
    return localStorage.getItem(this.jwtTokenKey) || '';
  }

  // Inicio sesión en el backend.
  login(username: string, password: string): Observable<{ success: boolean }> {

    console.log('Attempting login with username:', username);

    return this.http.post<{ token: string }>(
      this.apiURL + '/auth/login',
      { username, password }
    ).pipe(
      map((data) => {

        console.log('Inicio de sesión exitoso:', data);

        if (data?.token) {
          localStorage.setItem(this.jwtTokenKey, data.token);
          localStorage.setItem(this.usernameKey, username);

          this.isLoggedIn.set(true);

          return { success: true };
        }

        return { success: false };
      }),

      catchError((error) => {
        console.error('Error en la solicitud de inicio de sesión:', error);

        this.isLoggedIn.set(false);

        return of({ success: false });
      })
    );
  }

  // Cierro sesión.
  logout(): void {

    localStorage.removeItem(this.jwtTokenKey);
    localStorage.removeItem(this.usernameKey);

    this.isLoggedIn.set(false);

    console.log('Usuario ha cerrado sesión');
  }

  // Cabecera con el token para las rutas protegidas.
  private authHeaders(): { Authorization: string } {
    return { Authorization: `Bearer ${this.getToken()}` };
  }

  // Lista los comentarios de un post.
  listComments(postId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(
      `${this.apiURL}/comments/list/${postId}`,
      { headers: this.authHeaders() }
    );
  }

  // Crea un comentario en un post.
  createComment(postId: number, content: string): Observable<Comment> {
    return this.http.post<Comment>(
      `${this.apiURL}/comments/create/${postId}`,
      { comment: content },
      { headers: this.authHeaders() }
    );
  }

  // Borra un comentario propio.
  deleteComment(commentId: number): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.apiURL}/comments/delete/${commentId}`,
      {},
      { headers: this.authHeaders() }
    );
  }

  // Indica si he dado like a un post (función doIlike del backend).
  doILike(postId: number): Observable<{ liked: boolean }> {
    return this.http.get<{ liked: boolean }>(
      `${this.apiURL}/like/doILike/${postId}`,
      { headers: this.authHeaders() }
    );
  }

  // Devuelve el total de likes de un post (función countLike del backend).
  countLike(postId: number): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(
      `${this.apiURL}/like/count/${postId}`,
      { headers: this.authHeaders() }
    );
  }

  // Da o quita el like de un post.
  toggleLike(postId: number): Observable<{ liked: boolean; count: number }> {
    return this.http.get<{ liked: boolean; count: number }>(
      `${this.apiURL}/like/switch-like/${postId}`,
      { headers: this.authHeaders() }
    );
  }

  // Crea un post con su imagen. El navegador pone el Content-Type multipart
  // con el boundary correcto, por eso no se indica aquí.
  createPost(caption: string, image: File): Observable<string> {
    const formData = new FormData();
    formData.append('caption', caption);
    formData.append('image', image);

    return this.http.post(`${this.apiURL}/posts/create-post`, formData, {
      headers: this.authHeaders(),
      responseType: 'text',
    });
  }

  // Borra un post. El backend solo permite borrar los propios.
  deletePost(postId: number): Observable<{ success: boolean }> {
    return this.http.get<{ success: boolean }>(
      `${this.apiURL}/posts/delete-post/${postId}`,
      { headers: this.authHeaders() }
    );
  }
}