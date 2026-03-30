import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TrainingService } from '../../services/training.service';
import {
  SessionFeedbackRequest, SessionFeedbackResponse, ExerciseFeedback,
  FeedbackAvailability
} from '../../models/training.model';

interface ExerciseFeedbackForm extends ExerciseFeedback {
  exerciseName: string;
  /** true wenn der User für diese Übung bereits einen RPE-Wert gewählt hat */
  rpeSelected: boolean;
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

  sessionRpe = 0;  // 0 = noch nicht gewählt
  userNote   = '';
  exerciseFeedbacks: ExerciseFeedbackForm[] = [];

  /** Feedback-Verfügbarkeit */
  availability: FeedbackAvailability | null = null;
  isCheckingAvailability = true;

  isLoadingPlan = false;
  isSubmitting  = false;
  errorMessage: string | null = null;
  result: SessionFeedbackResponse | null = null;

  readonly rpeLabels: Record<number, string> = {
    0: 'Noch nicht gewählt',
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
    this.checkAvailabilityThenLoad();
  }

  /** Schritt 1: Feedback-Verfügbarkeit prüfen */
  private checkAvailabilityThenLoad(): void {
    this.isCheckingAvailability = true;
    this.trainingService.getFeedbackAvailability(this.planId).subscribe({
      next: avail => {
        this.availability = avail;
        this.isCheckingAvailability = false;
        if (avail.allowed && avail.isActive) {
          this.loadExercises();
        }
      },
      error: () => {
        this.errorMessage = 'Verfügbarkeit konnte nicht geprüft werden.';
        this.isCheckingAvailability = false;
      }
    });
  }

  /** Schritt 2: Übungen laden */
  private loadExercises(): void {
    this.isLoadingPlan = true;
    this.trainingService.getPlan(this.planId).subscribe({
      next: plan => {
        this.exerciseFeedbacks = plan.exercises.map(ex => ({
          plannedExerciseId: ex.id,
          exerciseName:      ex.exerciseName,
          exerciseRpe:       0,       // 0 = noch nicht gewählt (Pflicht!)
          rpeSelected:       false,
          setsCompleted:     ex.sets,
          repsCompleted:     ex.reps,
          weightUsed:        ex.weightKg,
          note:              ''
        }));
        this.isLoadingPlan = false;
      },
      error: () => {
        this.errorMessage = 'Trainingsplan konnte nicht geladen werden.';
        this.isLoadingPlan = false;
      }
    });
  }

  // ── Validierung ───────────────────────────────────────────────────

  /**
   * Gibt true zurück, wenn das Formular vollständig ausgefüllt ist.
   * Pflichtfelder:
   *   - sessionRpe: muss 1–10 sein (> 0)
   *   - jede Übung: exerciseRpe muss gewählt worden sein
   */
  get isFormValid(): boolean {
    if (this.sessionRpe < 1 || this.sessionRpe > 10) return false;
    return this.exerciseFeedbacks.every(ef => ef.rpeSelected);
  }

  /** Anzahl der Übungen ohne RPE-Auswahl */
  get missingRpeCount(): number {
    return this.exerciseFeedbacks.filter(ef => !ef.rpeSelected).length;
  }

  // ── Interaktion ───────────────────────────────────────────────────

  selectSessionRpe(n: number): void  { this.sessionRpe = n; }

  selectExerciseRpe(index: number, n: number): void {
    this.exerciseFeedbacks[index].exerciseRpe = n;
    this.exerciseFeedbacks[index].rpeSelected = true;
  }

  onSubmit(): void {
    if (!this.isFormValid || this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMessage = null;

    const request: SessionFeedbackRequest = {
      trainingPlanId:    this.planId,
      sessionRpe:        this.sessionRpe,
      userNote:          this.userNote || undefined,
      exerciseFeedbacks: this.exerciseFeedbacks.map(ef => ({
        plannedExerciseId: ef.plannedExerciseId,
        exerciseRpe:       ef.exerciseRpe,
        setsCompleted:     ef.setsCompleted,
        repsCompleted:     ef.repsCompleted,
        weightUsed:        ef.weightUsed,
        note:              ef.note || undefined
      }))
    };

    this.trainingService.submitFeedback(request).subscribe({
      next: res => {
        this.result      = res;
        this.isSubmitting = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: err => {
        this.errorMessage = err.error?.message ?? 'Feedback konnte nicht gesendet werden.';
        this.isSubmitting = false;
      }
    });
  }

  // ── Style-Helpers ─────────────────────────────────────────────────

  rpeColor(rpe: number): string {
    if (rpe <= 0)  return '';
    if (rpe <= 4)  return 'rpe--easy';
    if (rpe <= 6)  return 'rpe--moderate';
    if (rpe <= 8)  return 'rpe--target';
    return 'rpe--hard';
  }

  weightDiff(prev: number, next: number): string {
    const d = next - prev;
    if (d > 0)  return `+${d.toFixed(1)} kg`;
    if (d < 0)  return `${d.toFixed(1)} kg`;
    return '±0';
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
