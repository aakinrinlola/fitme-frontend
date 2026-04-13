import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TrainingService } from '../../services/training.service';
import { ExerciseInput, ExerciseTemplate, DayTemplate, TrainingPlanDetail } from '../../models/training.model';

interface ManualDay {
  dayName: string;
  exercises: ExerciseInput[];
}

@Component({
  selector: 'app-training-plan-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './training-plan-edit.html',
  styleUrls: ['./training-plan-edit.scss']
})
export class TrainingPlanEdit implements OnInit {

  planId!: number;
  plan: TrainingPlanDetail | null = null;

  planName    = '';
  description = '';
  trainingDays: ManualDay[] = [];
  activeDayTab = 0;
  includeManualMobilityPlan = false;
  mobilityExercises: ExerciseInput[] = [];

  isLoading = false;
  isSaving  = false;

  errorMessage:   string | null = null;
  successMessage: string | null = null;

  // ── Vorlagen-Feature ────────────────────────────────────────────────────────
  exerciseTemplates: ExerciseTemplate[] = [];
  dayTemplates:      DayTemplate[]      = [];

  activeSuggestionKey: string | null    = null;
  suggestions:         ExerciseTemplate[] = [];

  saveExModal:       { dayIdx: number | 'mob'; exIdx: number; muscleGroup: string; muscleFocus: string[] } | null = null;
  loadDayModal:      { dayIdx: number; filterGroup: string } | null = null;
  saveDayModal:      { dayIdx: number; name: string; muscleGroup: string } | null = null;
  saveMobilityModal: { name: string } | null = null;
  pickExModal:       { target: number | 'mob'; filterGroup: string } | null = null;
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

  readonly dayNames = ['Tag A', 'Tag B', 'Tag C', 'Tag D', 'Tag E', 'Tag F', 'Tag G'];

  constructor(
    private route:           ActivatedRoute,
    private router:          Router,
    private trainingService: TrainingService
  ) {}

  ngOnInit(): void {
    this.planId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.planId) { this.router.navigate(['/dashboard']); return; }

    this.trainingService.getProfile().subscribe({
      next: (profile) => {
        if (profile.role !== 'ADMIN') {
          this.router.navigate(['/training-plan', this.planId]);
          return;
        }
        this.loadPlan();
      },
      error: () => this.router.navigate(['/dashboard'])
    });
  }

  private loadPlan(): void {
    this.isLoading = true;
    this.trainingService.getPlan(this.planId).subscribe({
      next: (plan) => {
        this.plan        = plan;
        this.planName    = plan.planName;
        this.description = plan.description || '';
        this.buildDaysFromPlan(plan);
        this.isLoading = false;
        this.loadTemplates();
      },
      error: () => {
        this.errorMessage = 'Plan konnte nicht geladen werden.';
        this.isLoading    = false;
      }
    });
  }

  private buildDaysFromPlan(plan: TrainingPlanDetail): void {
    const dayMap = new Map<string, ExerciseInput[]>();

    for (const ex of plan.exercises.slice().sort((a, b) => a.order - b.order)) {
      const key = ex.trainingDay || 'Tag A';
      if (!dayMap.has(key)) dayMap.set(key, []);
      dayMap.get(key)!.push({
        exerciseName: ex.exerciseName,
        sets:         ex.sets,
        reps:         ex.reps,
        weightKg:     ex.weightKg,
        restSeconds:  ex.restSeconds,
        targetRpe:    ex.targetRpe,
        description:  ex.description ?? '',
      });
    }

    this.trainingDays             = [];
    this.mobilityExercises        = [];
    this.includeManualMobilityPlan = false;

    for (const [dayName, exercises] of dayMap.entries()) {
      if (dayName === 'Mobilitätsblock') {
        this.includeManualMobilityPlan = true;
        this.mobilityExercises         = exercises;
      } else {
        this.trainingDays.push({ dayName, exercises });
      }
    }

    if (this.trainingDays.length === 0) {
      this.trainingDays = [{ dayName: 'Tag A', exercises: [this.emptyExercise()] }];
    }

    // Pre-expand description fields for exercises that already have content
    this.descExpanded = new Set<string>();
    this.trainingDays.forEach((day, di) => {
      day.exercises.forEach((ex, i) => {
        if (ex.description?.trim()) this.descExpanded.add(`d${di}_${i}`);
      });
    });
  }

  // ── Leere Vorlagen ─────────────────────────────────────────────────────────

  emptyExercise(): ExerciseInput {
    return { exerciseName: '', sets: 3, reps: 10, weightKg: 0, restSeconds: 90, targetRpe: 7 };
  }

  emptyMobilityExercise(): ExerciseInput {
    return { exerciseName: '', sets: 2, reps: 30, weightKg: 0, restSeconds: 30, description: '' };
  }

  // ── Tag-Verwaltung ─────────────────────────────────────────────────────────

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

  addMobilityExercise(): void    { this.mobilityExercises.push(this.emptyMobilityExercise()); }

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

  // ── Hilfsmethoden ──────────────────────────────────────────────────────────

  private buildExercises(): ExerciseInput[] {
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
    return exercises;
  }

  private validate(): boolean {
    const hasEmpty = this.trainingDays.some(d => d.exercises.some(e => !e.exerciseName.trim()))
      || (this.includeManualMobilityPlan && this.mobilityExercises.some(e => !e.exerciseName.trim()));
    if (!this.planName.trim() || hasEmpty) {
      this.errorMessage = 'Bitte fülle alle Pflichtfelder aus.';
      return false;
    }
    return true;
  }

  // ── Speichern ──────────────────────────────────────────────────────────────

  saveChanges(): void {
    if (!this.validate()) return;
    this.isSaving      = true;
    this.errorMessage  = null;

    this.trainingService.updatePlan(this.planId, {
      planName:    this.planName.trim(),
      description: this.description || undefined,
      exercises:   this.buildExercises()
    }).subscribe({
      next: () => {
        this.successMessage = 'Plan erfolgreich gespeichert.';
        this.isSaving       = false;
        setTimeout(() => this.router.navigate(['/training-plan', this.planId]), 1000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message ?? 'Speichern fehlgeschlagen.';
        this.isSaving     = false;
      }
    });
  }

  saveAsNew(): void {
    if (!this.validate()) return;
    this.isSaving     = true;
    this.errorMessage = null;

    this.trainingService.createPlan({
      planName:    this.planName.trim() + ' (Kopie)',
      description: this.description || undefined,
      exercises:   this.buildExercises()
    }).subscribe({
      next: (res) => {
        this.successMessage = 'Neuer Plan erstellt!';
        this.isSaving       = false;
        setTimeout(() => this.router.navigate(['/training-plan', res.id]), 1000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message ?? 'Erstellen fehlgeschlagen.';
        this.isSaving     = false;
      }
    });
  }
}
