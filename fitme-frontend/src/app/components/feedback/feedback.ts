import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TrainingService } from '../../services/training.service';
import {
  SessionFeedbackRequest,
  SessionFeedbackResponse,
  ExerciseFeedback
} from '../../models/training.model';

interface ExerciseFeedbackForm extends ExerciseFeedback {
  exerciseName: string;
}

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './feedback.html',
  styleUrls: ['./feedback.scss']
})
export class Feedback implements OnInit {
  planId!: number;

  sessionRpe = 7;
  userNote = '';
  exerciseFeedbacks: ExerciseFeedbackForm[] = [];

  isLoadingPlan = true;
  isSubmitting = false;
  errorMessage: string | null = null;
  result: SessionFeedbackResponse | null = null;

  readonly rpeLabels: Record<number, string> = {
    1: 'Sehr leicht', 2: 'Leicht', 3: 'Leicht',
    4: 'Moderat', 5: 'Moderat', 6: 'Mittel',
    7: 'Gut (Ziel)', 8: 'Hart', 9: 'Sehr hart', 10: 'Maximum'
  };

  constructor(
    private route: ActivatedRoute,
    private trainingService: TrainingService
  ) {}

  ngOnInit(): void {
    this.planId = Number(this.route.snapshot.paramMap.get('planId'));

    this.trainingService.getPlan(this.planId).subscribe({
      next: plan => {
        this.exerciseFeedbacks = plan.exercises.map(ex => ({
          plannedExerciseId: ex.id,
          exerciseName: ex.exerciseName,
          exerciseRpe: 7,
          setsCompleted: ex.sets,
          repsCompleted: ex.reps,
          weightUsed: ex.weightKg,
          note: ''
        }));
        this.isLoadingPlan = false;
      },
      error: () => {
        this.errorMessage = 'Plan konnte nicht geladen werden.';
        this.isLoadingPlan = false;
      }
    });
  }

  selectSessionRpe(rpe: number): void {
    this.sessionRpe = rpe;
  }

  selectExerciseRpe(index: number, rpe: number): void {
    this.exerciseFeedbacks[index].exerciseRpe = rpe;
  }

  onSubmit(): void {
    this.isSubmitting = true;
    this.errorMessage = null;
    this.result = null;

    const request: SessionFeedbackRequest = {
      trainingPlanId: this.planId,
      sessionRpe: this.sessionRpe,
      userNote: this.userNote || undefined,
      exerciseFeedbacks: this.exerciseFeedbacks.map(ef => ({
        plannedExerciseId: ef.plannedExerciseId,
        exerciseRpe: ef.exerciseRpe,
        setsCompleted: ef.setsCompleted,
        repsCompleted: ef.repsCompleted,
        weightUsed: ef.weightUsed,
        note: ef.note || undefined
      }))
    };

    this.trainingService.submitFeedback(request).subscribe({
      next: res => {
        this.result = res;
        this.isSubmitting = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: err => {
        this.errorMessage = err.error?.message ?? 'Feedback konnte nicht gesendet werden.';
        this.isSubmitting = false;
      }
    });
  }

  rpeColor(rpe: number): string {
    if (rpe <= 4) return 'rpe--easy';
    if (rpe <= 6) return 'rpe--moderate';
    if (rpe <= 8) return 'rpe--target';
    return 'rpe--hard';
  }

  weightDiff(prev: number, next: number): string {
    const diff = next - prev;
    if (diff > 0) return `+${diff.toFixed(1)} kg`;
    if (diff < 0) return `${diff.toFixed(1)} kg`;
    return '±0';
  }
}
