import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TrainingService } from '../../services/training.service';
import { AuthService } from '../../services/auth.service';
import { ExerciseInput } from '../../models/training.model';
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

  // Shared
  planName = '';
  description = '';
  exercises: ExerciseInput[] = [this.emptyExercise()];
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Auth — always loaded fresh from server
  currentUser: UserInfo | null = null;

  // AI mode inputs
  aiGoal = '';
  aiDaysPerWeek = 3;
  aiFocus = '';
  aiEquipment = 'GYM';
  aiNotes = '';
  isGenerating = false;
  aiGeneratedPlan = false;
  aiExplanation = '';

  readonly trainingGoals = [
    { value: 'MUSCLE_GAIN',     label: 'Muskelaufbau',  icon: '💪' },
    { value: 'FAT_LOSS',        label: 'Fettabbau',     icon: '🔥' },
    { value: 'STRENGTH',        label: 'Kraft',         icon: '🏋️' },
    { value: 'ENDURANCE',       label: 'Ausdauer',      icon: '🏃' },
    { value: 'GENERAL_FITNESS', label: 'Allgemein fit', icon: '⚡' },
  ];

  readonly focusOptions = [
    { value: 'UPPER_BODY', label: 'Oberkörper' },
    { value: 'LOWER_BODY', label: 'Unterkörper' },
    { value: 'FULL_BODY',  label: 'Ganzkörper' },
    { value: 'PUSH',       label: 'Push' },
    { value: 'PULL',       label: 'Pull' },
    { value: 'CORE',       label: 'Core' },
  ];

  readonly equipmentOptions = [
    { value: 'GYM',       label: '🏋️ Studio' },
    { value: 'HOME',      label: '🏠 Zuhause' },
    { value: 'DUMBBELLS', label: '🥊 Kurzhanteln' },
    { value: 'MINIMAL',   label: '🎒 Minimal' },
  ];

  constructor(
    private trainingService: TrainingService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load fresh profile from server so fitnessLevel changes are always reflected
    this.trainingService.getProfile().subscribe({
      next: (profile) => {
        const cached = this.authService.getCurrentUser();
        this.currentUser = {
          id:           profile.id,
          username:     profile.username,
          email:        profile.email,
          role:         profile.role,
          fitnessLevel: profile.fitnessLevel,
          age:          profile.age,
          weightKg:     profile.weightKg,
          heightCm:     profile.heightCm,
        };
      },
      error: () => {
        // Fallback: use cached token data
        this.currentUser = this.authService.getCurrentUser();
      }
    });
  }

  setMode(m: Mode): void {
    this.mode = m;
    this.errorMessage = null;
    this.successMessage = null;
    this.resetForm();
  }

  toggleFocus(value: string): void {
    this.aiFocus = this.aiFocus === value ? '' : value;
  }

  emptyExercise(): ExerciseInput {
    return { exerciseName: '', sets: 3, reps: 10, weightKg: 0, restSeconds: 90, targetRpe: 7 };
  }

  addExercise(): void { this.exercises.push(this.emptyExercise()); }

  removeExercise(index: number): void {
    if (this.exercises.length > 1) this.exercises.splice(index, 1);
  }

  fitnessLevelLabel(level: string): string {
    const map: Record<string, string> = {
      BEGINNER: 'Anfänger', INTERMEDIATE: 'Fortgeschritten', ADVANCED: 'Experte',
    };
    return map[level] ?? level;
  }

  // ── AI Generation via dedicated backend endpoint ─────────────────
  generateWithAi(): void {
    if (!this.aiGoal) {
      this.errorMessage = 'Bitte wähle ein Trainingsziel aus.';
      return;
    }

    this.isGenerating = true;
    this.errorMessage = null;

    const goalLabel  = this.trainingGoals.find(g => g.value === this.aiGoal)?.label ?? this.aiGoal;
    const focusLabel = this.focusOptions.find(f => f.value === this.aiFocus)?.label ?? '';
    const equipLabel = this.equipmentOptions.find(e => e.value === this.aiEquipment)?.label ?? '';

    const request = {
      goal:         goalLabel,
      fitnessLevel: this.currentUser?.fitnessLevel ?? 'BEGINNER',
      daysPerWeek:  this.aiDaysPerWeek,
      focus:        focusLabel,
      equipment:    equipLabel,
      age:          this.currentUser?.age ?? null,
      weightKg:     this.currentUser?.weightKg ?? null,
      notes:        this.aiNotes || null,
    };

    this.trainingService.generatePlanWithAi(request).subscribe({
      next: (res) => {
        try {
          const parsed = this.parseAiResponse(res.content ?? res.answer ?? '');
          this.planName      = parsed.planName;
          this.description   = parsed.description;
          this.exercises     = parsed.exercises;
          this.aiExplanation = parsed.explanation;
          this.aiGeneratedPlan = true;
        } catch (e) {
          console.error('Parse error:', e);
          this.errorMessage = 'KI-Antwort konnte nicht verarbeitet werden. Bitte versuche es erneut.';
        }
        this.isGenerating = false;
      },
      error: (err) => {
        console.error('Generate error:', err);
        const status = err?.status;
        if (status === 404) {
          this.errorMessage =
            'Der KI-Generierungs-Endpoint (/api/training-plans/generate) wurde nicht gefunden. ' +
            'Bitte füge ihn im Backend hinzu (siehe Anleitung unten).';
        } else if (status === 500) {
          this.errorMessage =
            'Backend-Fehler (500): Prüfe die Backend-Logs. ' +
            'Alternativ: manuellen Modus nutzen.';
        } else {
          this.errorMessage = `KI-Generierung fehlgeschlagen (Status: ${status ?? 'unbekannt'}).`;
        }
        this.isGenerating = false;
      }
    });
  }

  private parseAiResponse(raw: string): {
    planName: string; description: string; explanation: string; exercises: ExerciseInput[]
  } {
    let cleaned = raw.trim();
    cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object found');
    const data = JSON.parse(match[0]);

    const exercises: ExerciseInput[] = (data.exercises ?? [])
      .map((e: any) => ({
        exerciseName: String(e.exerciseName ?? '').trim(),
        sets:         Math.max(1, Number(e.sets ?? 3)),
        reps:         Math.max(1, Number(e.reps ?? 10)),
        weightKg:     Math.max(0, Number(e.weightKg ?? 0)),
        restSeconds:  Math.max(0, Number(e.restSeconds ?? 90)),
        targetRpe:    Math.min(10, Math.max(1, Number(e.targetRpe ?? 7))),
      }))
      .filter((e: ExerciseInput) => e.exerciseName.length > 0);

    if (exercises.length === 0) throw new Error('No valid exercises');

    return {
      planName:    String(data.planName ?? 'KI-Trainingsplan').trim(),
      description: String(data.description ?? '').trim(),
      explanation: String(data.explanation ?? '').trim(),
      exercises,
    };
  }

  saveAiPlan(): void { this.onSubmit(); }

  resetAi(): void {
    this.aiGeneratedPlan = false;
    this.aiExplanation = '';
    this.planName = '';
    this.description = '';
    this.exercises = [this.emptyExercise()];
    this.errorMessage = null;
  }

  resetForm(): void {
    this.planName = '';
    this.description = '';
    this.exercises = [this.emptyExercise()];
    this.aiGeneratedPlan = false;
    this.aiExplanation = '';
  }

  // ── Manual submit / shared save ──────────────────────────────────
  onSubmit(): void {
    if (!this.planName.trim() || this.exercises.some(e => !e.exerciseName.trim())) {
      this.errorMessage = 'Bitte fülle alle Pflichtfelder aus.';
      return;
    }

    this.isLoading = true;
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
      error: err => {
        this.errorMessage = err.error?.message ?? 'Plan konnte nicht erstellt werden.';
        this.isLoading = false;
      }
    });
  }
}
