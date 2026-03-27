import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TrainingService } from '../../services/training.service';
import { AuthService } from '../../services/auth.service';
import { ExerciseInput, GeneratePlanRequest } from '../../models/training.model';
import { UserInfo } from '../../models/auth.model';

type Mode = 'manual' | 'ai';

@Component({
  selector: 'app-training-plan-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './training-plan-create.html',
  styleUrls: ['./training-plan-create.scss']
})
export class TrainingPlanCreate implements OnInit {
  mode: Mode = 'manual';

  // ── Shared (manual mode) ────────────────────────────────────────
  planName = '';
  description = '';
  exercises: ExerciseInput[] = [this.emptyExercise()];
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // ── Auth ────────────────────────────────────────────────────────
  currentUser: UserInfo | null = null;

  // ── AI mode inputs (match the template bindings) ────────────────
  aiPlanName = '';
  aiUserPrompt = '';
  aiGoal = '';
  aiDaysPerWeek: number | null = null;
  aiFocusMuscles = '';
  aiExperienceLevel = '';

  // ── Dropdown options used by the template ───────────────────────
  readonly experienceLevels = [
    { value: 'BEGINNER', label: 'Anfänger' },
    { value: 'INTERMEDIATE', label: 'Fortgeschritten' },
    { value: 'ADVANCED', label: 'Experte' },
  ];

  readonly daysOptions = [1, 2, 3, 4, 5, 6, 7];

  readonly fitnessGoals = [
    { value: 'MUSCLE_GAIN', label: 'Muskelaufbau' },
    { value: 'FAT_LOSS', label: 'Fettabbau' },
    { value: 'STRENGTH', label: 'Kraftaufbau' },
    { value: 'ENDURANCE', label: 'Ausdauer' },
    { value: 'GENERAL_FITNESS', label: 'Allgemeine Fitness' },
  ];

  constructor(
    private trainingService: TrainingService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load fresh profile so fitnessLevel changes are reflected
    this.trainingService.getProfile().subscribe({
      next: (profile) => {
        this.currentUser = {
          id: profile.id,
          username: profile.username,
          email: profile.email,
          role: profile.role,
          fitnessLevel: profile.fitnessLevel,
          age: profile.age,
          weightKg: profile.weightKg,
          heightCm: profile.heightCm,
        };
      },
      error: () => {
        this.currentUser = this.authService.getCurrentUser();
      }
    });
  }

  // ── Mode toggle ─────────────────────────────────────────────────
  setMode(m: Mode): void {
    this.mode = m;
    this.errorMessage = null;
    this.successMessage = null;
  }

  // ── Exercise helpers (manual mode) ──────────────────────────────
  emptyExercise(): ExerciseInput {
    return { exerciseName: '', sets: 3, reps: 10, weightKg: 0, restSeconds: 90, targetRpe: 7 };
  }

  addExercise(): void {
    this.exercises.push(this.emptyExercise());
  }

  removeExercise(index: number): void {
    if (this.exercises.length > 1) this.exercises.splice(index, 1);
  }

  // ══════════════════════════════════════════════════════════════════
  // AI MODE — called by (ngSubmit)="onGenerateSubmit()" in template
  // ══════════════════════════════════════════════════════════════════

  /**
   * Builds a GeneratePlanRequest matching the backend DTO field names
   * (planName, userPrompt, fitnessGoal, daysPerWeek, focusMuscles, experienceLevel)
   * and sends it to POST /api/training-plans/generate.
   *
   * The backend generates the plan via AI, saves it, and returns {id, planName, exerciseCount, message}.
   * On success we navigate to the plan detail page.
   */
  onGenerateSubmit(): void {
    if (!this.aiPlanName.trim() || !this.aiUserPrompt.trim()) {
      this.errorMessage = 'Bitte gib einen Plannamen und eine Beschreibung ein.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const request: GeneratePlanRequest = {
      planName: this.aiPlanName.trim(),
      userPrompt: this.aiUserPrompt.trim(),
      fitnessGoal: this.aiGoal || undefined,
      daysPerWeek: this.aiDaysPerWeek ?? undefined,
      focusMuscles: this.aiFocusMuscles || undefined,
      experienceLevel: this.aiExperienceLevel || undefined,
    };

    this.trainingService.generatePlanWithAi(request).subscribe({
      next: (res) => {
        this.successMessage = `${res.message} (${res.exerciseCount} Übungen)`;
        this.isLoading = false;
        // Navigate to the newly created plan after a short delay so the user sees the success message
        setTimeout(() => this.router.navigate(['/training-plan', res.id]), 1200);
      },
      error: (err) => {
        console.error('Generate error:', err);
        const status = err?.status;
        if (status === 404) {
          this.errorMessage =
            'Der KI-Generierungs-Endpoint (/api/training-plans/generate) wurde nicht gefunden. ' +
            'Bitte prüfe, ob das Backend läuft und der Endpoint existiert.';
        } else if (status === 400) {
          this.errorMessage = err.error?.message ?? 'Ungültige Eingabe. Bitte prüfe deine Angaben.';
        } else if (status === 500) {
          this.errorMessage =
            'Backend-Fehler (500): Prüfe die Backend-Logs. ' +
            'Alternativ: manuellen Modus nutzen.';
        } else {
          this.errorMessage = err.error?.message ?? `KI-Generierung fehlgeschlagen (Status: ${status ?? 'unbekannt'}).`;
        }
        this.isLoading = false;
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // MANUAL MODE — called by (ngSubmit)="onSubmit()" in template
  // ══════════════════════════════════════════════════════════════════

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
