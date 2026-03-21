import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { TrainingService } from '../../services/training.service';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../models/training.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class Profile implements OnInit {
  profile$!: Observable<UserProfile>;
  profile: UserProfile | null = null;

  // Edit form
  editUsername = '';
  editEmail = '';
  editAge: number | null = null;
  editWeightKg: number | null = null;
  editHeightCm: number | null = null;
  editFitnessLevel = 'BEGINNER';

  // Password form
  oldPassword = '';
  newPassword = '';

  isLoadingProfile = true;
  isSavingProfile = false;
  isChangingPassword = false;

  profileError: string | null = null;
  profileSuccess: string | null = null;
  passwordError: string | null = null;
  passwordSuccess: string | null = null;

  readonly fitnessLevels = [
    { value: 'BEGINNER', label: 'Anfänger' },
    { value: 'INTERMEDIATE', label: 'Fortgeschritten' },
    { value: 'ADVANCED', label: 'Experte' }
  ];

  constructor(
    private trainingService: TrainingService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoadingProfile = true;
    this.trainingService.getProfile().subscribe({
      next: p => {
        this.profile = p;
        this.editUsername = p.username;
        this.editEmail = p.email;
        this.editAge = p.age || null;
        this.editWeightKg = p.weightKg || null;
        this.editHeightCm = p.heightCm || null;
        this.editFitnessLevel = p.fitnessLevel || 'BEGINNER';
        this.isLoadingProfile = false;
      },
      error: () => { this.isLoadingProfile = false; }
    });
  }

  saveProfile(): void {
    this.isSavingProfile = true;
    this.profileError = null;
    this.profileSuccess = null;

    this.trainingService.updateProfile({
      username: this.editUsername || undefined,
      email: this.editEmail || undefined,
      age: this.editAge ?? undefined,
      weightKg: this.editWeightKg ?? undefined,
      heightCm: this.editHeightCm ?? undefined,
      fitnessLevel: this.editFitnessLevel
    }).subscribe({
      next: p => {
        this.profile = p;
        this.profileSuccess = 'Profil erfolgreich gespeichert.';
        this.isSavingProfile = false;
      },
      error: err => {
        this.profileError = err.error?.message ?? 'Profil konnte nicht gespeichert werden.';
        this.isSavingProfile = false;
      }
    });
  }

  changePassword(): void {
    if (!this.oldPassword || !this.newPassword) return;
    this.isChangingPassword = true;
    this.passwordError = null;
    this.passwordSuccess = null;

    this.trainingService.changePassword(this.oldPassword, this.newPassword).subscribe({
      next: res => {
        this.passwordSuccess = res.message;
        this.oldPassword = '';
        this.newPassword = '';
        this.isChangingPassword = false;
      },
      error: err => {
        this.passwordError = err.error?.message ?? 'Passwort konnte nicht geändert werden.';
        this.isChangingPassword = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
