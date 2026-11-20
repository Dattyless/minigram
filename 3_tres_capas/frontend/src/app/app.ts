import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterOutlet } from '@angular/router';
import { RestApiService } from './services/rest-api.service';

@Component({
  imports: [RouterOutlet, RouterLink, MatButtonModule, MatToolbarModule],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  constructor(public restApiService: RestApiService) {}
  private RestApiService =  inject(RestApiService);
  onLogout() {
    this.restApiService.logout();
  }
}
