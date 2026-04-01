import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { UserInfo } from './models/auth.model';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {
  isLoggedIn = false;
  currentUser: UserInfo | null = null;

  /** True wenn Auth0-Modus aktiv — versteckt Login/Register-Links */
  readonly isAuth0Mode = environment.auth?.mode === 'auth0';

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
    });

    // Auth0-Modus: isAuthenticated$ abonnieren für reactive Updates
    if (this.isAuth0Mode) {
      this.authService.isAuthenticated$().subscribe(isAuth => {
        this.isLoggedIn = isAuth;
      });
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
