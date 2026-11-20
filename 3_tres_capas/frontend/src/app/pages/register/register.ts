import { Component, signal } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  imports: [
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormField,
  ],
  selector: 'app-register',
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register {
  protected readonly username = form(signal(''), (p) => {
    required(p, { message: 'Debes introducir un usuario' });
  });

  protected readonly email = form(signal(''), (p) => {
    required(p, { message: 'Debes introducir un valor' });
    email(p, { message: 'Correo no válido' });
  });

  protected readonly password = form(signal(''), (p) => {
    required(p, { message: 'Debes introducir una contraseña' });
  });

  protected readonly hide = signal(true);

  protected clickEvent(event: MouseEvent): void {
    this.hide.update((hidden) => !hidden);
    event.stopPropagation();
  }
}
