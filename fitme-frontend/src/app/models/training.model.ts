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
}

export interface TrainingPlanDetail {
  id: number;
  planName: string;
  description: string;
  active: boolean;
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
