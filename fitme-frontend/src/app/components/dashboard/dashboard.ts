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

  constructor(
    private authService: AuthService,
    private trainingService: TrainingService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadPlans();
  }

  loadPlans(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.trainingService.getMyPlans().subscribe({
      next: plans => {
        this.plans = plans;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Trainingspläne konnten nicht geladen werden.';
        this.isLoading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
