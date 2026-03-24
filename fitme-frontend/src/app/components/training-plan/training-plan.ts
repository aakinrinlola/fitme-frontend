import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TrainingService } from '../../services/training.service';
import { TrainingPlanDetail } from '../../models/training.model';

@Component({
  selector: 'app-training-plan',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './training-plan.html',
  styleUrls: ['./training-plan.scss']
})
export class TrainingPlan implements OnInit {
  plan: TrainingPlanDetail | null = null;
  planId!: number;
  isLoading = true;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private trainingService: TrainingService
  ) {}

  ngOnInit(): void {
    this.planId = Number(this.route.snapshot.paramMap.get('id'));

    this.trainingService.getPlan(this.planId).subscribe({
      next: plan => {
        this.plan = plan;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Trainingsplan konnte nicht geladen werden.';
        this.isLoading = false;
      }
    });
  }

  formatRest(seconds: number): string {
    if (seconds >= 60) return `${Math.floor(seconds / 60)} min`;
    return `${seconds}s`;
  }
}
