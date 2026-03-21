import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
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
  plan$!: Observable<TrainingPlanDetail>;
  planId!: number;
  isLoading = true;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private trainingService: TrainingService
  ) {}

  ngOnInit(): void {
    this.planId = Number(this.route.snapshot.paramMap.get('id'));
    this.plan$ = this.trainingService.getPlan(this.planId);
    this.plan$.subscribe({
      next: () => { this.isLoading = false; },
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
