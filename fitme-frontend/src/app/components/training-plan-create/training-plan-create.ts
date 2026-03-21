import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TrainingService } from '../../services/training.service';
import { ExerciseInput } from '../../models/training.model';

@Component({
  selector: 'app-training-plan-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './training-plan-create.html',
  styleUrls: ['./training-plan-create.scss']
})
export class TrainingPlanCreate {
  planName = '';
  description = '';
  exercises: ExerciseInput[] = [this.emptyExercise()];

  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(private trainingService: TrainingService, private router: Router) {}

  emptyExercise(): ExerciseInput {
    return {
      exerciseName: '',
      sets: 3,
      reps: 10,
      weightKg: 0,
      restSeconds: 90,
      targetRpe: 7
    };
  }

  addExercise(): void {
    this.exercises.push(this.emptyExercise());
  }

  removeExercise(index: number): void {
    if (this.exercises.length > 1) {
      this.exercises.splice(index, 1);
    }
  }

  onSubmit(): void {
    if (!this.planName.trim() || this.exercises.some(e => !e.exerciseName.trim())) {
      this.errorMessage = 'Bitte fülle alle Pflichtfelder aus.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.trainingService.createPlan({
      planName: this.planName,
      description: this.description || undefined,
      exercises: this.exercises
    }).subscribe({
      next: (res) => {
        this.successMessage = res.message;
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/training-plan', res.id]), 1200);
      },
      error: err => {
        this.errorMessage = err.error?.message ?? 'Plan konnte nicht erstellt werden.';
        this.isLoading = false;
      }
    });
  }
}
