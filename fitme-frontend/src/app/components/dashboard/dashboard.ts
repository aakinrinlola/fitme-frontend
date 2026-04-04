import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TrainingService } from '../../services/training.service';
import { TrainingPlanSummary } from '../../models/training.model';
import { UserInfo } from '../../models/auth.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit {
  currentUser: UserInfo | null = null;
  plans: TrainingPlanSummary[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  motivationalMessage  = '';
  isLoadingMotivation  = true;

  constructor(
    private authService: AuthService,
    private trainingService: TrainingService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadPlans();
    this.loadMotivationalMessage();
  }

  loadPlans(): void {
    this.isLoading    = true;
    this.errorMessage = null;
    this.trainingService.getMyPlans().subscribe({
      next: plans => {
        this.plans     = plans;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Trainingspläne konnten nicht geladen werden.';
        this.isLoading    = false;
      }
    });
  }

  loadMotivationalMessage(): void {
    this.isLoadingMotivation = true;
    this.trainingService.getProfile().subscribe({
      next: profile => {
        this.motivationalMessage  = profile.motivationalMessage ?? '';
        this.isLoadingMotivation  = false;
      },
      error: () => {
        this.isLoadingMotivation = false;
      }
    });
  }

  getRemainingDays(activeUntil: string | null | undefined): number {
    if (!activeUntil) return 999;
    const diffMs = new Date(activeUntil).getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  logout(): void {
    this.authService.logout();
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
