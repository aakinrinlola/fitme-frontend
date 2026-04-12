import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateTrainingPlanRequest, GeneratePlanRequest,
  TrainingPlanSummary, TrainingPlanDetail,
  SessionFeedbackRequest, SessionFeedbackResponse,
  SessionHistoryEntry, UpdateProfileRequest, UserProfile,
  FeedbackAvailability, PlanLimitInfo,
  BodyScanEntry, BodyScanRequest,
  ExerciseTemplate, DayTemplate
} from '../models/training.model';

export interface GeneratePlanResponse {
  id: number; planName: string; exerciseCount: number; message: string;
}

export interface SetStatusResponse {
  id: number; active: boolean; activeUntil: string | null; message: string;
}

@Injectable({ providedIn: 'root' })
export class TrainingService {
  private readonly baseUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  // ── Plans ──────────────────────────────────────────────────────
  createPlan(req: CreateTrainingPlanRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/training-plans`, req);
  }

  getMyPlans(): Observable<TrainingPlanSummary[]> {
    return this.http.get<TrainingPlanSummary[]>(`${this.baseUrl}/training-plans`);
  }

  getPlan(planId: number): Observable<TrainingPlanDetail> {
    return this.http.get<TrainingPlanDetail>(`${this.baseUrl}/training-plans/${planId}`);
  }

  getFeedbackAvailability(planId: number): Observable<FeedbackAvailability> {
    return this.http.get<FeedbackAvailability>(
      `${this.baseUrl}/training-plans/${planId}/feedback-availability`
    );
  }

  setActiveStatus(planId: number, active: boolean): Observable<SetStatusResponse> {
    return this.http.patch<SetStatusResponse>(
      `${this.baseUrl}/training-plans/${planId}/status`,
      { active }
    );
  }

  setPlanStatus(planId: number, active: boolean): Observable<SetStatusResponse> {
    return this.setActiveStatus(planId, active);
  }

  updatePlan(planId: number, req: CreateTrainingPlanRequest): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/training-plans/${planId}`, req);
  }

  deletePlan(planId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/training-plans/${planId}`);
  }

  generatePlanWithAi(req: GeneratePlanRequest): Observable<GeneratePlanResponse> {
    return this.http.post<GeneratePlanResponse>(
      `${this.baseUrl}/training-plans/generate`, req
    );
  }

  // ── Feedback ───────────────────────────────────────────────────
  submitFeedback(req: SessionFeedbackRequest): Observable<SessionFeedbackResponse> {
    return this.http.post<SessionFeedbackResponse>(`${this.baseUrl}/feedback`, req);
  }

  getHistory(): Observable<SessionHistoryEntry[]> {
    return this.http.get<SessionHistoryEntry[]>(`${this.baseUrl}/feedback/history`);
  }

  // ── Profile ────────────────────────────────────────────────────
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/users/me`);
  }

  updateProfile(req: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/users/me`, req);
  }

  changePassword(oldPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.baseUrl}/users/me/password`, { oldPassword, newPassword }
    );
  }

  getPlanLimit(): Observable<PlanLimitInfo> {
    return this.http.get<PlanLimitInfo>(`${this.baseUrl}/users/me/plan-limit`);
  }

  // BodyScan

  /** Gesamte Body-Scan-Historie des eingeloggten Nutzers (neueste zuerst). */
  getBodyScanHistory(): Observable<BodyScanEntry[]> {
    return this.http.get<BodyScanEntry[]>(`${this.baseUrl}/body-scan`);
  }

  /** Neuen Body-Scan-Eintrag speichern */
  saveBodyScan(req: BodyScanRequest): Observable<BodyScanEntry> {
    return this.http.post<BodyScanEntry>(`${this.baseUrl}/body-scan`, req);
  }

  /** Body-Scan-Eintrag löschen. */
  deleteBodyScan(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/body-scan/${id}`);
  }

  // ── Übungs-Vorlagen ────────────────────────────────────────────────────────
  getExerciseTemplates(muscleGroup?: string): Observable<ExerciseTemplate[]> {
    const params = muscleGroup ? `?muscleGroup=${encodeURIComponent(muscleGroup)}` : '';
    return this.http.get<ExerciseTemplate[]>(`${this.baseUrl}/exercise-templates${params}`);
  }

  saveExerciseTemplate(req: Omit<ExerciseTemplate, 'id'>): Observable<ExerciseTemplate> {
    return this.http.post<ExerciseTemplate>(`${this.baseUrl}/exercise-templates`, req);
  }

  deleteExerciseTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/exercise-templates/${id}`);
  }

  // ── Tag-Vorlagen ───────────────────────────────────────────────────────────
  getDayTemplates(muscleGroup?: string): Observable<DayTemplate[]> {
    const params = muscleGroup ? `?muscleGroup=${encodeURIComponent(muscleGroup)}` : '';
    return this.http.get<DayTemplate[]>(`${this.baseUrl}/day-templates${params}`);
  }

  saveDayTemplate(req: Omit<DayTemplate, 'id'>): Observable<DayTemplate> {
    return this.http.post<DayTemplate>(`${this.baseUrl}/day-templates`, req);
  }

  deleteDayTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/day-templates/${id}`);
  }
}
