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

  // ── Manueller Modus ─────────────────────────────────────────────────────
  planName    = '';
  description = '';
  exercises: ExerciseInput[] = [this.emptyExercise()];

  // ── Auth ─────────────────────────────────────────────────────────────────
  currentUser: UserInfo | null = null;

  // ── KI-Modus: Basis ──────────────────────────────────────────────────────
  aiPlanName   = '';
  aiUserPrompt = '';
  aiGoal       = '';
  aiDaysPerWeek: number | null = null;
  aiExperienceLevel = '';

  // ── KI-Modus: NEU — Trainingsdauer ──────────────────────────────────────
  aiSessionDuration: number | null = null;

  // ── KI-Modus: NEU — Muskel-Fokus (Chips + Freitext) ─────────────────────
  aiFocusMuscleGroups: string[] = [];
  aiFocusMusclesFreetext = '';

  // ── KI-Modus: NEU — Regeneration ────────────────────────────────────────
  aiSleepHours: number | null = null;
  aiStressLevel = '';

  // ── KI-Modus: NEU — Verletzungen ────────────────────────────────────────
  aiInjuries = '';

  // ── KI-Modus: NEU — Mobilitätsplan ──────────────────────────────────────
  includeMobilityPlan = false;

  // ── Status ───────────────────────────────────────────────────────────────
  isLoading      = false;
  errorMessage:   string | null = null;
  successMessage: string | null = null;

  // ── Dropdown-Optionen ────────────────────────────────────────────────────
  readonly durationOptions = [
    { value: 30, label: '30 min' },
    { value: 45, label: '45 min' },
    { value: 60, label: '60 min' },
    { value: 75, label: '75 min' },
    { value: 90, label: '90 min' },
  ];

  readonly muscleGroupOptions = [
    'Beine', 'Glutes', 'Rücken', 'Brust', 'Schultern', 'Arme', 'Core', 'Ganzkörper'
  ];

  readonly sleepOptions = [
    { value: 5,  label: '≤ 5h — wenig Schlaf' },
    { value: 6,  label: '6h' },
    { value: 7,  label: '7h' },
    { value: 8,  label: '8h' },
    { value: 9,  label: '≥ 9h — viel Schlaf' },
  ];

  readonly experienceLevels = [
    { value: 'BEGINNER',     label: 'Anfänger' },
    { value: 'INTERMEDIATE', label: 'Fortgeschritten' },
    { value: 'ADVANCED',     label: 'Experte' },
  ];

  readonly daysOptions = [1, 2, 3, 4, 5, 6, 7];

  readonly fitnessGoals = [
    { value: 'MUSCLE_GAIN',     label: 'Muskelaufbau' },
    { value: 'FAT_LOSS',        label: 'Fettabbau' },
    { value: 'STRENGTH',        label: 'Kraftaufbau' },
    { value: 'ENDURANCE',       label: 'Ausdauer' },
    { value: 'GENERAL_FITNESS', label: 'Allgemeine Fitness' },
  ];

  constructor(
    private trainingService: TrainingService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.trainingService.getProfile().subscribe({
      next: (profile) => {
        this.currentUser = {
          id: profile.id, username: profile.username, email: profile.email,
          role: profile.role, fitnessLevel: profile.fitnessLevel,
          age: profile.age, weightKg: profile.weightKg, heightCm: profile.heightCm,
        };
      },
      error: () => { this.currentUser = this.authService.getCurrentUser(); }
    });
  }

  // ── Modus-Toggle ─────────────────────────────────────────────────────────
  setMode(m: Mode): void {
    this.mode = m;
    this.errorMessage   = null;
    this.successMessage = null;
    this.resetAiFields();
  }

  private resetAiFields(): void {
    this.aiSessionDuration    = null;
    this.aiFocusMuscleGroups  = [];
    this.aiFocusMusclesFreetext = '';
    this.aiSleepHours         = null;
    this.aiStressLevel        = '';
    this.aiInjuries           = '';
    this.includeMobilityPlan  = false;
  }

  // ── Fokus-Chips ──────────────────────────────────────────────────────────
  toggleMuscleGroup(muscle: string): void {
    const idx = this.aiFocusMuscleGroups.indexOf(muscle);
    if (idx >= 0) this.aiFocusMuscleGroups.splice(idx, 1);
    else          this.aiFocusMuscleGroups.push(muscle);
  }

  isMuscleGroupSelected(muscle: string): boolean {
    return this.aiFocusMuscleGroups.includes(muscle);
  }

  // ── Mobility-Toggle nur für INTERMEDIATE / ADVANCED ──────────────────────
  get showMobilityOption(): boolean {
    const level = (this.aiExperienceLevel || this.currentUser?.fitnessLevel || '').toUpperCase();
    return level === 'INTERMEDIATE' || level === 'ADVANCED';
  }

  // ── Manuelle Übungen ─────────────────────────────────────────────────────
  emptyExercise(): ExerciseInput {
    return { exerciseName: '', sets: 3, reps: 10, weightKg: 0, restSeconds: 90, targetRpe: 7 };
  }
  addExercise():                    { this.exercises.push(this.emptyExercise()); }
  removeExercise(index: number):    { if (this.exercises.length > 1) this.exercises.splice(index, 1); }

  // ── KI-Plan generieren ───────────────────────────────────────────────────
  onGenerateSubmit(): void {
    if (!this.aiPlanName.trim() || !this.aiUserPrompt.trim()) {
      this.errorMessage = 'Bitte gib einen Plannamen und eine Beschreibung ein.';
      return;
    }

    this.isLoading      = true;
    this.errorMessage   = null;
    this.successMessage = null;

    // Fokus aus Chips + Freitext zusammenführen
    const focusMuscles = [...this.aiFocusMuscleGroups, this.aiFocusMusclesFreetext]
      .filter(Boolean).join(', ') || undefined;

    const request: GeneratePlanRequest = {
      planName:               this.aiPlanName.trim(),
      userPrompt:             this.aiUserPrompt.trim(),
      fitnessGoal:            this.aiGoal || undefined,
      daysPerWeek:            this.aiDaysPerWeek ?? undefined,
      focusMuscles,
      experienceLevel:        this.aiExperienceLevel || undefined,
      // ── Neue Parameter ──────────────────────────────────────
      sessionDurationMinutes: this.aiSessionDuration ?? undefined,
      sleepHoursPerNight:     this.aiSleepHours ?? undefined,
      stressLevel:            this.aiStressLevel || undefined,
      injuries:               this.aiInjuries || undefined,
      focusMuscleGroups:      this.aiFocusMuscleGroups.length > 0 ? [...this.aiFocusMuscleGroups] : undefined,
      focusMusclesFreetext:   this.aiFocusMusclesFreetext || undefined,
      includeMobilityPlan:    this.includeMobilityPlan || undefined,
    };

    this.trainingService.generatePlanWithAi(request).subscribe({
      next: (res) => {
        this.successMessage = `${res.message} (${res.exerciseCount} Übungen)`;
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/training-plan', res.id]), 1200);
      },
      error: (err) => {
        const status = err?.status;
        this.errorMessage = status === 404
          ? 'KI-Endpoint nicht gefunden. Bitte Backend prüfen.'
          : err.error?.message ?? `KI-Generierung fehlgeschlagen (Status: ${status ?? '?'}).`;
        this.isLoading = false;
      }
    });
  }

  // ── Manuellen Plan erstellen ─────────────────────────────────────────────
  onSubmit(): void {
    if (!this.planName.trim() || this.exercises.some(e => !e.exerciseName.trim())) {
      this.errorMessage = 'Bitte fülle alle Pflichtfelder aus.';
      return;
    }
    this.isLoading    = true;
    this.errorMessage = null;

    this.trainingService.createPlan({
      planName:    this.planName,
      description: this.description || undefined,
      exercises:   this.exercises
    }).subscribe({
      next: (res) => {
        this.successMessage = res.message;
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/training-plan', res.id]), 1200);
      },
      error: (err) => {
        this.errorMessage = err.error?.message ?? 'Plan konnte nicht erstellt werden.';
        this.isLoading = false;
      }
    });
  }
}
