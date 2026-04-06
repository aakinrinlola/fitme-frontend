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
  focusMuscles?: string;
  experienceLevel?: string;
  sessionDurationMinutes?: number;
  sleepHoursPerNight?: number;
  stressLevel?: string;
  injuries?: string;
  focusMuscleGroups?: string[];
  focusMusclesFreetext?: string;
  includeMobilityPlan?: boolean;
  /**
   * Steuert die Verteilung der Fokus-Muskelgruppen auf die Trainingstage.
   * 'DOUBLE_FOCUS' → Fokus bekommt 2 Trainingstage mit unterschiedlichem Schwerpunkt.
   * 'BALANCED'     → Klassischer Split (z.B. Push/Pull/Legs), Fokus-Tag kommt zuerst.
   * null           → Standard (= BALANCED)
   */
  focusStrategy?: 'DOUBLE_FOCUS' | 'BALANCED';
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
  motivationalMessage?: string;
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
  motivationalMessage?: string;
}

export interface PlanLimitInfo {
  used: number;
  limit: number;
  remaining: number;
  role: string;
  resetsAt: string;
}
