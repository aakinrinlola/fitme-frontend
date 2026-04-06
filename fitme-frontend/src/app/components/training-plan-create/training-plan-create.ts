import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TrainingService } from '../../services/training.service';
import { AuthService } from '../../services/auth.service';
import { ExerciseInput, GeneratePlanRequest, PlanLimitInfo } from '../../models/training.model';
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

  planName    = '';
  description = '';
  exercises: ExerciseInput[] = [this.emptyExercise()];

  currentUser: UserInfo | null = null;

  aiPlanName   = '';
  aiUserPrompt = '';
  aiGoal       = '';
  aiDaysPerWeek: number | null = null;
  aiExperienceLevel = '';
  aiSessionDuration: number | null = null;
  aiFocusMuscleGroups: string[] = [];
  aiFocusMusclesFreetext = '';
  aiSleepHours: number | null = null;
  aiStressLevel = '';
  aiInjuries = '';
  includeMobilityPlan = false;

  /** Fokus-Strategie: null = kein Auswahl, 'DOUBLE_FOCUS' = 2 Fokus-Tage, 'BALANCED' = klassischer Split */
  aiFocusStrategy: 'DOUBLE_FOCUS' | 'BALANCED' | null = null;

  planLimitInfo: PlanLimitInfo | null = null;
  isLoadingLimit = false;

  isLoading      = false;
  errorMessage:   string | null = null;
  successMessage: string | null = null;

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
    { value: 5, label: '≤ 5h — wenig Schlaf' },
    { value: 6, label: '6h' },
    { value: 7, label: '7h' },
    { value: 8, label: '8h' },
    { value: 9, label: '≥ 9h — viel Schlaf' },
  ];

  readonly experienceLevels = [
    { value: 'BEGINNER',     label: 'Anfänger' },
    { value: 'INTERMEDIATE', label: 'Fortgeschritten' },
    { value: 'ADVANCED',     label: 'Experte' },
  ];

  readonly daysOptions = [
    { value: 1 },
    { value: 2 },
    { value: 3 },
  ];

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
    this.loadPlanLimit();
  }

  // ── Plan-Limit ─────────────────────────────────────────────────────────────

  loadPlanLimit(): void {
    this.isLoadingLimit = true;
    this.trainingService.getPlanLimit().subscribe({
      next: info => { this.planLimitInfo = info; this.isLoadingLimit = false; },
      error: () => { this.isLoadingLimit = false; }
    });
  }

  get limitPercent(): number {
    if (!this.planLimitInfo || this.planLimitInfo.limit === -1) return 0;
    return Math.min((this.planLimitInfo.used / this.planLimitInfo.limit) * 100, 100);
  }

  get isPremium(): boolean { return this.planLimitInfo?.role === 'PREMIUM'; }
  get isAdmin(): boolean   { return this.planLimitInfo?.role === 'ADMIN'; }

  get isLimitReached(): boolean {
    if (!this.planLimitInfo || this.planLimitInfo.limit === -1) return false;
    return this.planLimitInfo.remaining <= 0;
  }

  get limitResetDate(): string {
    if (!this.planLimitInfo) return '';
    return new Date(this.planLimitInfo.resetsAt).toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  // ── Fokus-Strategie ────────────────────────────────────────────────────────

  /**
   * Zeigt die Strategie-Auswahl, wenn mind. eine Fokus-Muskelgruppe
   * gewählt ist UND mind. 2 Trainingstage ausgewählt sind.
   */
  get showFocusStrategy(): boolean {
    return (this.aiFocusMuscleGroups.length > 0 || !!this.aiFocusMusclesFreetext?.trim())
      && (this.aiDaysPerWeek ?? 0) >= 2;
  }

  /** Beschriftung für DOUBLE_FOCUS — dynamisch nach Fokus + Tagesanzahl */
  get doubleFocusLabel(): string {
    const days  = this.aiDaysPerWeek ?? 3;
    const focus = this.aiFocusMuscleGroups[0] ?? 'Fokus';
    if (days >= 3) {
      return `2 ${focus}-Tage (Quad & Hinge oder Kraft & Hypertrophie) + 1 anderer Tag`;
    }
    return `2 ${focus}-Tage mit unterschiedlichem Schwerpunkt`;
  }

  /** Beschriftung für BALANCED */
  get balancedSplitLabel(): string {
    const days = this.aiDaysPerWeek ?? 3;
    return days >= 3
      ? 'Klassischer Split (z.B. Push / Pull / Beine) — Fokus-Tag kommt zuerst'
      : '1 Fokus-Tag + 1 ausgewogener Ganzkörper-Tag';
  }

  // ── Modus ──────────────────────────────────────────────────────────────────

  setMode(m: Mode): void {
    this.mode = m;
    this.errorMessage   = null;
    this.successMessage = null;
    this.resetAiFields();
  }

  private resetAiFields(): void {
    this.aiSessionDuration     = null;
    this.aiFocusMuscleGroups   = [];
    this.aiFocusMusclesFreetext = '';
    this.aiSleepHours          = null;
    this.aiStressLevel         = '';
    this.aiInjuries            = '';
    this.includeMobilityPlan   = false;
    this.aiFocusStrategy       = null;
  }

  toggleMuscleGroup(muscle: string): void {
    const idx = this.aiFocusMuscleGroups.indexOf(muscle);
    if (idx >= 0) this.aiFocusMuscleGroups.splice(idx, 1);
    else          this.aiFocusMuscleGroups.push(muscle);
    // Strategie zurücksetzen wenn kein Fokus mehr aktiv
    if (!this.showFocusStrategy) this.aiFocusStrategy = null;
  }

  isMuscleGroupSelected(muscle: string): boolean {
    return this.aiFocusMuscleGroups.includes(muscle);
  }

  get showMobilityOption(): boolean {
    const level = (this.aiExperienceLevel || this.currentUser?.fitnessLevel || '').toUpperCase();
    return level === 'INTERMEDIATE' || level === 'ADVANCED';
  }

  emptyExercise(): ExerciseInput {
    return { exerciseName: '', sets: 3, reps: 10, weightKg: 0, restSeconds: 90, targetRpe: 7 };
  }
  addExercise(): void    { this.exercises.push(this.emptyExercise()); }
  removeExercise(i: number): void { if (this.exercises.length > 1) this.exercises.splice(i, 1); }

  // ── KI-Generierung ─────────────────────────────────────────────────────────

  onGenerateSubmit(): void {
    if (!this.aiPlanName.trim() || !this.aiUserPrompt.trim()) {
      this.errorMessage = 'Bitte gib einen Plannamen und eine Beschreibung ein.';
      return;
    }
    if (this.isLimitReached) {
      this.errorMessage = `Monatliches Limit erreicht. Nächste Pläne wieder ab ${this.limitResetDate} möglich.`;
      return;
    }

    this.isLoading      = true;
    this.errorMessage   = null;
    this.successMessage = null;

    const focusMuscles = [...this.aiFocusMuscleGroups, this.aiFocusMusclesFreetext]
      .filter(Boolean).join(', ') || undefined;

    const request: GeneratePlanRequest = {
      planName:               this.aiPlanName.trim(),
      userPrompt:             this.aiUserPrompt.trim(),
      fitnessGoal:            this.aiGoal || undefined,
      daysPerWeek:            this.aiDaysPerWeek ?? undefined,
      focusMuscles,
      experienceLevel:        this.aiExperienceLevel || undefined,
      sessionDurationMinutes: this.aiSessionDuration ?? undefined,
      sleepHoursPerNight:     this.aiSleepHours ?? undefined,
      stressLevel:            this.aiStressLevel || undefined,
      injuries:               this.aiInjuries || undefined,
      focusMuscleGroups:      this.aiFocusMuscleGroups.length > 0 ? [...this.aiFocusMuscleGroups] : undefined,
      focusMusclesFreetext:   this.aiFocusMusclesFreetext || undefined,
      includeMobilityPlan:    this.includeMobilityPlan || undefined,
      focusStrategy:          this.aiFocusStrategy ?? undefined,
    };

    this.trainingService.generatePlanWithAi(request).subscribe({
      next: (res) => {
        this.successMessage = `${res.message} (${res.exerciseCount} Übungen)`;
        this.isLoading = false;
        this.loadPlanLimit();
        setTimeout(() => this.router.navigate(['/training-plan', res.id]), 1200);
      },
      error: (err) => {
        const status = err?.status;
        this.errorMessage = status === 404
          ? 'KI-Endpoint nicht gefunden.'
          : err.error?.message ?? `KI-Generierung fehlgeschlagen (Status: ${status ?? '?'}).`;
        this.isLoading = false;
      }
    });
  }

  // ── Manueller Plan ─────────────────────────────────────────────────────────

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
