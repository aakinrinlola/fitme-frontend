import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateTrainingPlanRequest, GeneratePlanRequest,
  TrainingPlanSummary, TrainingPlanDetail,
  SessionFeedbackRequest, SessionFeedbackResponse,
  SessionHistoryEntry, UpdateProfileRequest, UserProfile,
  FeedbackAvailability
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

  /** Prüft ob Feedback für diese Woche möglich ist */
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
}
