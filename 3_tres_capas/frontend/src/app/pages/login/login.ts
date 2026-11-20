import { Component, inject, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { RestApiService } from '../../services/rest-api.service';

interface LoginCredentials {
  username: string;
  password: string;
}

@Component({
  imports: [
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormField,
  ],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly api = inject(RestApiService);
  private readonly router = inject(Router);

  protected readonly credentials = signal<LoginCredentials>({ username: '', password: '' });

  protected readonly loginForm = form(this.credentials, (p) => {
    required(p.username, { message: 'Debes introducir un usuario' });
    required(p.password, { message: 'Debes introducir una contraseña' });
  });

  protected readonly hide = signal(true);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  // Actualiza el valor de la contraseña en el formulario.
  protected updatePassword(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.loginForm.password().value.set(value);
  }

  protected clickEvent(event: MouseEvent): void {
    this.hide.update((hidden) => !hidden);
    event.stopPropagation();
  }

  protected submit(event: Event): void {
    event.preventDefault();

    if (this.loginForm().invalid()) {
      this.loginForm().markAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { username, password } = this.credentials();

    this.api.login(username, password).subscribe({
      next: ({ success }) => {
        this.loading.set(false);

        if (success) {
          void this.router.navigateByUrl('/');
          return;
        }

        this.errorMessage.set('Usuario o contraseña incorrectos');
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('No se ha podido conectar con el servidor');
      },
    });
  }
}
