export interface ExerciseInput {
  exerciseName: string;
  sets: number;
  reps: number;
  weightKg: number;
  restSeconds: number;
  targetRpe?: number;
  trainingDay?: string;
  description?: string;
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
  showBodyScanInDashboard?: boolean;
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
  showBodyScanInDashboard: boolean;
  hasBodyScanData: boolean;
}

export interface ExerciseTemplate {
  id: number;
  exerciseName: string;
  muscleGroup: string;
  muscleFocus: string;
  defaultSets: number;
  defaultReps: number;
  defaultWeightKg: number;
  defaultRestSeconds: number;
  defaultTargetRpe: number;
  description: string;
}

export interface DayTemplate {
  id: number;
  templateName: string;
  muscleGroup: string;
  exercises: {
    exerciseName: string;
    sets: number;
    reps: number;
    weightKg: number;
    restSeconds: number;
    targetRpe: number;
    description: string;
  }[];
}

export interface PlanLimitInfo {
  used: number;
  limit: number;
  remaining: number;
  role: string;
  resetsAt: string;
}

// ── Body Scan ──────────────────────────────────────────────────────────────────

/** Ein einzelner Messwert-Satz (eine Zeile im Eintrag). */
export interface BodyScanEntry {
  id: number;
  measuredAt: string;           // ISO-Date "2025-03-01"

  // Körperkomposition
  bmi:               number | null;
  bodyFatPercent:    number | null;   // Fettmasse %
  bodyFatKg:         number | null;   // Fettmasse kg
  leanMassPercent:   number | null;   // Fettfreie Masse %
  bodyWaterPercent:  number | null;   // Körperwasser %
  visceralFatKg:     number | null;   // Viszerales Fett kg

  // Bioimpedanz / Vitalwerte
  phaseAngle:        number | null;   // Phasenwinkel
  oxygenSaturation:  number | null;   // Sauerstoffsättigung %

  // Segmentale Muskelwerte (kg)
  muscleKgTorso:     number | null;
  muscleKgArmRight:  number | null;
  muscleKgArmLeft:   number | null;
  muscleKgLegRight:  number | null;
  muscleKgLegLeft:   number | null;
}

/** Request-Modell zum Speichern eines neuen Eintrags. */
export interface BodyScanRequest {
  measuredAt: string;           // ISO-Date "2025-03-01"

  bmi?:               number;
  bodyFatPercent?:    number;
  bodyFatKg?:         number;
  leanMassPercent?:   number;
  bodyWaterPercent?:  number;
  visceralFatKg?:     number;
  phaseAngle?:        number;
  oxygenSaturation?:  number;
  muscleKgTorso?:     number;
  muscleKgArmRight?:  number;
  muscleKgArmLeft?:   number;
  muscleKgLegRight?:  number;
  muscleKgLegLeft?:   number;
}

/**
 * Metadaten für eine Tabellenzeile in der Vergleichsansicht.
 * Definiert Label, Einheit und Bewertungsrichtung.
 */
export interface BodyScanRowMeta {
  key:      keyof BodyScanEntry;
  label:    string;
  unit:     string;
  /** 'less' = weniger ist besser | 'more' = mehr ist besser | 'neutral' = keine Bewertung */
  direction: 'less' | 'more' | 'neutral';
}

/** Alle Zeilendefinitionen in der kanonischen Anzeigereihenfolge. */
export const BODY_SCAN_ROWS: BodyScanRowMeta[] = [
  { key: 'bmi',              label: 'BMI',                    unit: '',    direction: 'neutral' },
  { key: 'bodyFatPercent',   label: 'Fettmasse',              unit: '%',   direction: 'less'    },
  { key: 'bodyFatKg',        label: 'Fettmasse',              unit: 'kg',  direction: 'less'    },
  { key: 'leanMassPercent',  label: 'Fettfreie Masse',        unit: '%',   direction: 'more'    },
  { key: 'bodyWaterPercent', label: 'Körperwasser',           unit: '%',   direction: 'more'    },
  { key: 'visceralFatKg',    label: 'Viszerales Fett',        unit: 'kg',  direction: 'less'    },
  { key: 'phaseAngle',       label: 'Phasenwinkel',           unit: '°',   direction: 'more'    },
  { key: 'oxygenSaturation', label: 'Sauerstoffsättigung',    unit: '%',   direction: 'more'    },
  { key: 'muscleKgTorso',    label: 'Muskelmasse Torso',      unit: 'kg',  direction: 'more'    },
  { key: 'muscleKgArmRight', label: 'Muskelmasse Arm re.',    unit: 'kg',  direction: 'more'    },
  { key: 'muscleKgArmLeft',  label: 'Muskelmasse Arm li.',    unit: 'kg',  direction: 'more'    },
  { key: 'muscleKgLegRight', label: 'Muskelmasse Bein re.',   unit: 'kg',  direction: 'more'    },
  { key: 'muscleKgLegLeft',  label: 'Muskelmasse Bein li.',   unit: 'kg',  direction: 'more'    },
];
