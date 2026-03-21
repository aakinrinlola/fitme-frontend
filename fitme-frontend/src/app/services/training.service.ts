import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateTrainingPlanRequest,
  TrainingPlanSummary,
  TrainingPlanDetail,
  SessionFeedbackRequest,
  SessionFeedbackResponse,
  SessionHistoryEntry,
  UpdateProfileRequest,
  UserProfile
} from '../models/training.model';

@Injectable({ providedIn: 'root' })
export class TrainingService {
  private readonly baseUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  // ── Training Plans ──────────────────────────────────────────────
  createPlan(request: CreateTrainingPlanRequest): Observable<{ id: number; planName: string; exerciseCount: number; message: string }> {
    return this.http.post<any>(`${this.baseUrl}/training-plans`, request);
  }

  getMyPlans(): Observable<TrainingPlanSummary[]> {
    return this.http.get<TrainingPlanSummary[]>(`${this.baseUrl}/training-plans`);
  }

  getPlan(planId: number): Observable<TrainingPlanDetail> {
    return this.http.get<TrainingPlanDetail>(`${this.baseUrl}/training-plans/${planId}`);
  }

  // ── Feedback ────────────────────────────────────────────────────
  submitFeedback(request: SessionFeedbackRequest): Observable<SessionFeedbackResponse> {
    return this.http.post<SessionFeedbackResponse>(`${this.baseUrl}/feedback`, request);
  }

  getHistory(): Observable<SessionHistoryEntry[]> {
    return this.http.get<SessionHistoryEntry[]>(`${this.baseUrl}/feedback/history`);
  }

  // ── User Profile ─────────────────────────────────────────────────
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/users/me`);
  }

  updateProfile(request: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/users/me`, request);
  }

  changePassword(oldPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/users/me/password`, { oldPassword, newPassword });
  }
}
