import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class Register {
  username = '';
  email = '';
  password = '';
  age: number | null = null;
  weightKg: number | null = null;
  heightCm: number | null = null;
  fitnessLevel = 'BEGINNER';

  isLoading = false;
  errorMessage: string | null = null;

  readonly fitnessLevels = [
    { value: 'BEGINNER', label: 'Anfänger' },
    { value: 'INTERMEDIATE', label: 'Fortgeschritten' },
    { value: 'ADVANCED', label: 'Experte' }
  ];

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.authService.register({
      username: this.username,
      email: this.email,
      password: this.password,
      age: this.age ?? undefined,
      weightKg: this.weightKg ?? undefined,
      heightCm: this.heightCm ?? undefined,
      fitnessLevel: this.fitnessLevel
    }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.errorMessage = err.error?.message ?? 'Registrierung fehlgeschlagen.';
        this.isLoading = false;
      }
    });
  }
}
