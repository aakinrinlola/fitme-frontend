import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {
  usernameOrEmail = '';
  password = '';
  isLoading = false;
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    if (!this.usernameOrEmail || !this.password) return;

    this.isLoading = true;
    this.errorMessage = null;

    this.authService.login({ usernameOrEmail: this.usernameOrEmail, password: this.password })
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: err => {
          this.errorMessage = err.error?.message ?? 'Anmeldung fehlgeschlagen.';
          this.isLoading = false;
        }
      });
  }
}
