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

/** KI-Plan-Generierung — Feldnamen müssen exakt zum Backend-DTO passen */
export interface GeneratePlanRequest {
  planName: string;
  userPrompt: string;
  fitnessGoal?: string;
  daysPerWeek?: number;
  focusMuscles?: string;
  experienceLevel?: string;
}

export interface TrainingPlanSummary {
  id: number;
  planName: string;
  exerciseCount: number;
  active: boolean;
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
  /** Trainingstag-Label (z.B. "Tag A", "Tag B"). Leer-String bei manuellen Plänen. */
  trainingDay: string;
}

export interface TrainingPlanDetail {
  id: number;
  planName: string;
  description: string;
  active: boolean;
  exercises: PlannedExercise[];
}

/** Gruppierte Ansicht eines Trainingstages für das UI */
export interface TrainingDayGroup {
  dayName: string;
  exercises: PlannedExercise[];
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
