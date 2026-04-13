import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TrainingService } from '../../services/training.service';
import { AuthService } from '../../services/auth.service';
import { ExerciseInput, ExerciseTemplate, DayTemplate, GeneratePlanRequest, PlanLimitInfo } from '../../models/training.model';
import { UserInfo } from '../../models/auth.model';

type Mode = 'manual' | 'ai' | 'template';

interface ManualDay {
  dayName: string;
  exercises: ExerciseInput[];
}

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
  trainingDays: ManualDay[] = [{ dayName: 'Tag A', exercises: [this.emptyExercise()] }];
  activeDayTab = 0;
  includeManualMobilityPlan = false;
  mobilityExercises: ExerciseInput[] = [];

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

  // ── Vorlagen-Feature ────────────────────────────────────────────────────────
  exerciseTemplates: ExerciseTemplate[] = [];
  dayTemplates:      DayTemplate[]      = [];

  activeSuggestionKey: string | null = null;
  suggestions:         ExerciseTemplate[] = [];

  saveExModal:        { dayIdx: number | 'mob'; exIdx: number; muscleGroup: string; muscleFocus: string[] } | null = null;
  loadDayModal:       { dayIdx: number; filterGroup: string } | null = null;
  saveDayModal:       { dayIdx: number; name: string; muscleGroup: string } | null = null;
  saveMobilityModal:  { name: string } | null = null;
  pickExModal:        { target: number | 'mob'; filterGroup: string } | null = null;
  descExpanded = new Set<string>();

  readonly muscleGroupsForLibrary = [
    'Beine', 'Rücken', 'Brust', 'Schultern', 'Arme', 'Core', 'Ganzkörper', 'Mobilität'
  ];

  readonly muscleFocusOptions: Record<string, string[]> = {
    'Beine':     ['Quadrizeps', 'Hamstrings', 'Glutes', 'Waden', 'Plyometrics'],
    'Brust':     ['Obere Brust', 'Untere Brust', 'Volle Brust', 'Innenbereich'],
    'Rücken':    ['Latissimus', 'Mitte / Rhomboids', 'Unterer Rücken', 'Trapez'],
    'Schultern': ['Vordere Schulter', 'Seitliche Schulter', 'Hintere Schulter'],
    'Arme':      ['Bizeps', 'Trizeps', 'Unterarme'],
    'Core':      ['Bauchgerade', 'Schräge', 'Unterer Bauch', 'Stabilität'],
  };

  get focusOptionsForSaveModal(): string[] {
    return this.saveExModal ? (this.muscleFocusOptions[this.saveExModal.muscleGroup] ?? []) : [];
  }

  toggleSaveFocus(tag: string): void {
    if (!this.saveExModal) return;
    const idx = this.saveExModal.muscleFocus.indexOf(tag);
    if (idx >= 0) this.saveExModal.muscleFocus.splice(idx, 1);
    else          this.saveExModal.muscleFocus.push(tag);
  }

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
    this.loadTemplates();
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

  // ── Validierung ────────────────────────────────────────────────────────────

  get validationErrors(): string[] {
    const errors: string[] = [];

    if (!this.planName.trim()) {
      errors.push('Planname fehlt');
    }

    for (const day of this.trainingDays) {
      for (let i = 0; i < day.exercises.length; i++) {
        if (!day.exercises[i].exerciseName.trim()) {
          errors.push(`${day.dayName}: Übung ${i + 1} – Übungsname fehlt`);
        }
      }
    }

    if (this.includeManualMobilityPlan) {
      for (let i = 0; i < this.mobilityExercises.length; i++) {
        if (!this.mobilityExercises[i].exerciseName.trim()) {
          errors.push(`Mobilitätsblock: Übung ${i + 1} – Übungsname fehlt`);
        }
      }
    }

    return errors;
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

  emptyMobilityExercise(): ExerciseInput {
    return { exerciseName: '', sets: 2, reps: 30, weightKg: 0, restSeconds: 30, description: '' };
  }

  // ── Multi-Day Management ────────────────────────────────────────────────────

  readonly dayNames = ['Tag A', 'Tag B', 'Tag C', 'Tag D', 'Tag E', 'Tag F', 'Tag G'];

  addDay(): void {
    if (this.trainingDays.length >= 7) return;
    this.trainingDays.push({ dayName: this.dayNames[this.trainingDays.length], exercises: [this.emptyExercise()] });
    this.activeDayTab = this.trainingDays.length - 1;
  }

  removeDay(i: number): void {
    if (this.trainingDays.length <= 1) return;
    this.trainingDays.splice(i, 1);
    this.trainingDays.forEach((d, idx) => d.dayName = this.dayNames[idx]);
    if (this.activeDayTab >= this.trainingDays.length) {
      this.activeDayTab = this.trainingDays.length - 1;
    }
  }

  addExercise(dayIdx: number): void {
    this.trainingDays[dayIdx].exercises.push(this.emptyExercise());
  }

  removeExercise(dayIdx: number, exIdx: number): void {
    const day = this.trainingDays[dayIdx];
    if (day.exercises.length > 1) day.exercises.splice(exIdx, 1);
  }

  toggleManualMobilityPlan(): void {
    this.includeManualMobilityPlan = !this.includeManualMobilityPlan;
    if (this.includeManualMobilityPlan && this.mobilityExercises.length === 0) {
      this.mobilityExercises.push(this.emptyMobilityExercise());
    }
  }

  addMobilityExercise(): void {
    this.mobilityExercises.push(this.emptyMobilityExercise());
  }

  removeMobilityExercise(i: number): void {
    if (this.mobilityExercises.length > 1) this.mobilityExercises.splice(i, 1);
  }

  // ── Vorlagen laden ─────────────────────────────────────────────────────────

  loadTemplates(): void {
    this.trainingService.getExerciseTemplates().subscribe({ next: ts => this.exerciseTemplates = ts, error: () => {} });
    this.trainingService.getDayTemplates().subscribe({ next: ts => this.dayTemplates = ts, error: () => {} });
  }

  // ── Autocomplete ───────────────────────────────────────────────────────────

  onNameInput(key: string, value: string): void {
    this.activeSuggestionKey = key;
    if (!value.trim()) { this.suggestions = []; return; }
    const q = value.toLowerCase();
    this.suggestions = this.exerciseTemplates.filter(t => t.exerciseName.toLowerCase().includes(q)).slice(0, 6);
  }

  selectSuggestion(dayIdx: number | 'mob', exIdx: number, tpl: ExerciseTemplate): void {
    const ex = dayIdx === 'mob' ? this.mobilityExercises[exIdx] : this.trainingDays[dayIdx as number].exercises[exIdx];
    if (ex) {
      ex.exerciseName = tpl.exerciseName;
      ex.sets         = tpl.defaultSets;
      ex.reps         = tpl.defaultReps;
      ex.weightKg     = tpl.defaultWeightKg;
      ex.restSeconds  = tpl.defaultRestSeconds;
      ex.targetRpe    = tpl.defaultTargetRpe;
      if (tpl.description) ex.description = tpl.description;
    }
    this.closeSuggestions();
  }

  closeSuggestions(): void { this.activeSuggestionKey = null; this.suggestions = []; }

  suggestionsFor(key: string): ExerciseTemplate[] {
    return this.activeSuggestionKey === key ? this.suggestions : [];
  }

  hideSuggestionsDelayed(): void { setTimeout(() => this.closeSuggestions(), 160); }

  // ── Übung in Bibliothek speichern ──────────────────────────────────────────

  openSaveExModal(dayIdx: number | 'mob', exIdx: number): void {
    this.saveExModal = { dayIdx, exIdx, muscleGroup: '', muscleFocus: [] };
  }

  confirmSaveExercise(): void {
    if (!this.saveExModal) return;
    const { dayIdx, exIdx, muscleGroup } = this.saveExModal;
    const ex = dayIdx === 'mob' ? this.mobilityExercises[exIdx] : this.trainingDays[dayIdx as number].exercises[exIdx];
    if (!ex?.exerciseName.trim()) { this.saveExModal = null; return; }

    const muscleFocus = this.saveExModal.muscleFocus.join(',');
    this.trainingService.saveExerciseTemplate({
      exerciseName:       ex.exerciseName, muscleGroup, muscleFocus,
      defaultSets:        ex.sets,         defaultReps:        ex.reps,
      defaultWeightKg:    ex.weightKg,     defaultRestSeconds: ex.restSeconds,
      defaultTargetRpe:   ex.targetRpe ?? 7, description:      ex.description ?? ''
    } as any).subscribe({ next: t => { this.exerciseTemplates.push(t); this.saveExModal = null; }, error: () => { this.saveExModal = null; } });
  }

  deleteExTemplate(id: number): void {
    this.trainingService.deleteExerciseTemplate(id).subscribe({
      next: () => this.exerciseTemplates = this.exerciseTemplates.filter(t => t.id !== id), error: () => {}
    });
  }

  // ── Tag-Vorlage laden ──────────────────────────────────────────────────────

  openLoadDayModal(dayIdx: number): void { this.loadDayModal = { dayIdx, filterGroup: '' }; }

  get filteredDayTemplates(): DayTemplate[] {
    if (!this.loadDayModal) return [];
    return this.loadDayModal.filterGroup
      ? this.dayTemplates.filter(t => t.muscleGroup === this.loadDayModal!.filterGroup)
      : this.dayTemplates;
  }

  // ── Aus Vorlage starten ────────────────────────────────────────────────────

  templateStartFilter = '';

  get filteredStartTemplates(): DayTemplate[] {
    return this.templateStartFilter
      ? this.dayTemplates.filter(t => t.muscleGroup === this.templateStartFilter)
      : this.dayTemplates;
  }

  applyStartTemplate(tpl: DayTemplate): void {
    this.trainingDays = [{
      dayName: 'Tag A',
      exercises: tpl.exercises.map(e => ({
        exerciseName: e.exerciseName, sets: e.sets, reps: e.reps, weightKg: e.weightKg,
        restSeconds: e.restSeconds, targetRpe: e.targetRpe, description: e.description
      }))
    }];
    this.mode = 'manual';
  }

  applyDayTemplate(tpl: DayTemplate): void {
    if (!this.loadDayModal) return;
    this.trainingDays[this.loadDayModal.dayIdx].exercises = tpl.exercises.map(e => ({
      exerciseName: e.exerciseName, sets: e.sets, reps: e.reps, weightKg: e.weightKg,
      restSeconds: e.restSeconds, targetRpe: e.targetRpe, description: e.description
    }));
    this.loadDayModal = null;
  }

  // ── Aktuellen Tag als Vorlage speichern ────────────────────────────────────

  openSaveDayModal(dayIdx: number): void {
    this.saveDayModal = { dayIdx, name: this.trainingDays[dayIdx].dayName, muscleGroup: '' };
  }

  confirmSaveDayTemplate(): void {
    if (!this.saveDayModal) return;
    const { dayIdx, name, muscleGroup } = this.saveDayModal;
    if (!name.trim()) { this.saveDayModal = null; return; }
    const day = this.trainingDays[dayIdx];
    this.trainingService.saveDayTemplate({
      templateName: name.trim(), muscleGroup,
      exercises: day.exercises.map(e => ({
        exerciseName: e.exerciseName, sets: e.sets, reps: e.reps, weightKg: e.weightKg,
        restSeconds: e.restSeconds, targetRpe: e.targetRpe ?? 7, description: e.description ?? ''
      }))
    } as any).subscribe({ next: t => { this.dayTemplates.push(t); this.saveDayModal = null; }, error: () => { this.saveDayModal = null; } });
  }

  deleteDayTmpl(id: number): void {
    this.trainingService.deleteDayTemplate(id).subscribe({
      next: () => this.dayTemplates = this.dayTemplates.filter(t => t.id !== id), error: () => {}
    });
  }

  // ── Mobilitätsblock als Vorlage speichern ──────────────────────────────────

  openSaveMobilityModal(): void {
    this.saveMobilityModal = { name: 'Mobilitätsblock' };
  }

  confirmSaveMobilityTemplate(): void {
    if (!this.saveMobilityModal) return;
    const { name } = this.saveMobilityModal;
    if (!name.trim()) { this.saveMobilityModal = null; return; }
    this.trainingService.saveDayTemplate({
      templateName: name.trim(), muscleGroup: 'Mobilität',
      exercises: this.mobilityExercises.map(e => ({
        exerciseName: e.exerciseName, sets: e.sets, reps: e.reps, weightKg: e.weightKg,
        restSeconds: e.restSeconds, targetRpe: e.targetRpe ?? 0, description: e.description ?? ''
      }))
    } as any).subscribe({ next: t => { this.dayTemplates.push(t); this.saveMobilityModal = null; }, error: () => { this.saveMobilityModal = null; } });
  }

  // ── Übung aus Bibliothek wählen ────────────────────────────────────────────

  openPickExModal(target: number | 'mob'): void {
    this.pickExModal = { target, filterGroup: target === 'mob' ? 'Mobilität' : '' };
  }

  get filteredPickExercises(): ExerciseTemplate[] {
    if (!this.pickExModal?.filterGroup) return [];
    const group = this.pickExModal.filterGroup;
    const match = group === 'Beine'
      ? (t: ExerciseTemplate) => t.muscleGroup === 'Beine' || t.muscleGroup === 'Glutes'
      : (t: ExerciseTemplate) => t.muscleGroup === group;
    return this.exerciseTemplates.filter(match);
  }

  addExFromLibrary(tpl: ExerciseTemplate): void {
    if (!this.pickExModal) return;
    const isMob = this.pickExModal.target === 'mob';
    const ex: ExerciseInput = {
      exerciseName:  tpl.exerciseName,
      sets:          3,
      reps:          tpl.defaultReps,
      weightKg:      tpl.defaultWeightKg,
      restSeconds:   tpl.defaultRestSeconds,
      targetRpe:     isMob ? undefined : tpl.defaultTargetRpe,
      description:   tpl.description ?? '',
    };
    if (isMob) {
      this.mobilityExercises.push(ex);
    } else {
      this.trainingDays[this.pickExModal.target as number].exercises.push(ex);
    }
  }

  // ── Beschreibung für normale Übungen ──────────────────────────────────────

  toggleDesc(key: string): void {
    if (this.descExpanded.has(key)) this.descExpanded.delete(key);
    else this.descExpanded.add(key);
  }

  isDescExpanded(key: string): boolean {
    return this.descExpanded.has(key);
  }

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
    const errors = this.validationErrors;
    if (errors.length > 0) {
      this.errorMessage = errors.join(' · ');
      return;
    }
    this.isLoading    = true;
    this.errorMessage = null;

    const exercises: ExerciseInput[] = [];
    for (const day of this.trainingDays) {
      for (const ex of day.exercises) {
        exercises.push({ ...ex, trainingDay: day.dayName });
      }
    }
    if (this.includeManualMobilityPlan) {
      for (const ex of this.mobilityExercises) {
        exercises.push({ ...ex, trainingDay: 'Mobilitätsblock' });
      }
    }

    this.trainingService.createPlan({
      planName:    this.planName,
      description: this.description || undefined,
      exercises
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
