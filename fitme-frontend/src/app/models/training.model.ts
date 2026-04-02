export interface ExerciseInput {
  exerciseName: string;
  sets: number;
  reps: number;
  weightKg: number;
  restSeconds: number;
  targetRpe?: number;
}

export interface CreateTrainingPlanRequest {
  planName: string;
  description?: string;
  exercises: ExerciseInput[];
}

export interface GeneratePlanRequest {
  planName: string;
  userPrompt: string;
  fitnessGoal?: string;
  daysPerWeek?: number;
  /** Legacy Freitext, intern mit focusMuscleGroups gemergt */
  focusMuscles?: string;
  experienceLevel?: string;
  // ── Neu ──────────────────────────────────────────────────────
  /** Trainingsdauer: 30 / 45 / 60 / 75 / 90 Minuten */
  sessionDurationMinutes?: number;
  /** Schlafstunden pro Nacht */
  sleepHoursPerNight?: number;
  /** LOW / MODERATE / HIGH */
  stressLevel?: string;
  /** Freitext für Verletzungen / Einschränkungen */
  injuries?: string;
  /** Vordefinierte Chip-Auswahl z.B. ["Beine","Glutes"] */
  focusMuscleGroups?: string[];
  /** Zusätzlicher Freitext-Fokus */
  focusMusclesFreetext?: string;
  /** true → KI erstellt Mobilitätsblock */
  includeMobilityPlan?: boolean;
}

export interface TrainingPlanSummary {
  id: number;
  planName: string;
  exerciseCount: number;
  active: boolean;
  activeUntil?: string | null;
  currentWeek: number;
  planDurationWeeks: number;
  feedbackAllowedThisWeek: boolean;
  nextFeedbackAvailableAt?: string | null;
}

export interface PlannedExercise {
  id: number;
  exerciseName: string;
  sets: number;
  reps: number;
  weightKg: number;
  restSeconds: number;
  targetRpe: number;
  order: number;
  trainingDay: string;
  /** Kurze Ausführungsbeschreibung (v.a. für Mobilitätsübungen) */
  description?: string;
}

export interface TrainingPlanDetail {
  id: number;
  planName: string;
  description: string;
  active: boolean;
  activeUntil?: string | null;
  planDurationWeeks: number;
  currentWeek: number;
  feedbackAllowedThisWeek: boolean;
  nextFeedbackAvailableAt?: string | null;
  exercises: PlannedExercise[];
}

export interface TrainingDayGroup {
  dayName: string;
  exercises: PlannedExercise[];
}

export interface FeedbackAvailability {
  planId: number;
  isActive: boolean;
  allowed: boolean;
  reason: string;
  currentWeek: number;
  planDurationWeeks: number;
  nextFeedbackAvailableAt?: string | null;
}

export interface ExerciseFeedback {
  plannedExerciseId: number;
  exerciseRpe: number;
  setsCompleted?: number;
  repsCompleted?: number;
  weightUsed?: number;
  note?: string;
}

export interface SessionFeedbackRequest {
  trainingPlanId: number;
  sessionRpe: number;
  userNote?: string;
  exerciseFeedbacks?: ExerciseFeedback[];
}

export interface ExerciseAdjustment {
  exerciseId: number;
  exerciseName: string;
  previousWeight: number;
  newWeight: number;
  previousReps: number;
  newReps: number;
  previousSets: number;
  newSets: number;
  adjustmentReason: string;
}

export interface AdherenceStats {
  totalPlanned: number;
  totalCompleted: number;
  adherencePercent: number;
}

export interface SessionFeedbackResponse {
  sessionId: number;
  sessionRpe: number;
  aiExplanation: string;
  adjustments: ExerciseAdjustment[];
  adherenceStats: AdherenceStats;
}

export interface SessionHistoryEntry {
  sessionId: number;
  date: string;
  sessionRpe: number;
  completed: boolean;
  aiResponse: string;
  userNote: string;
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
  age?: number;
  weightKg?: number;
  heightCm?: number;
  fitnessLevel?: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  fitnessLevel: string;
  age: number;
  weightKg: number;
  heightCm: number;
  createdAt: string;
}
