import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TrainingService } from '../../services/training.service';
import {
  FeedbackAvailability, PlannedExercise,
  SessionFeedbackResponse, TrainingDayGroup, TrainingPlanDetail
} from '../../models/training.model';

@Component({
  selector: 'app-training-plan',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe],
  templateUrl: './training-plan.html',
  styleUrls: ['./training-plan.scss']
})
export class TrainingPlan implements OnInit {

  plan: TrainingPlanDetail | null = null;
  dayGroups: TrainingDayGroup[] = [];
  feedbackAvailability: FeedbackAvailability | null = null;

  isLoading       = false;
  statusMessage:  string | null = null;
  showDeleteConfirm  = false;
  showFeedbackModal  = false;

  sessionRpe  = 6;
  feedbackNote = '';
  feedbackResult: SessionFeedbackResponse | null = null;

  private planId!: number;

  constructor(
    private route:           ActivatedRoute,
    private router:          Router,
    private trainingService: TrainingService
  ) {}

  ngOnInit(): void {
    this.planId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.planId) { this.router.navigate(['/dashboard']); return; }
    this.loadPlan();
  }

  private loadPlan(): void {
    this.isLoading = true;
    this.trainingService.getPlan(this.planId).subscribe({
      next: (plan) => {
        this.plan      = plan;
        this.dayGroups = this.groupByDay(plan.exercises);
        this.isLoading = false;
        this.loadFeedbackAvailability();
      },
      error: () => { this.isLoading = false; }
    });
  }

  private loadFeedbackAvailability(): void {
    if (!this.plan?.active) return;
    this.trainingService.getFeedbackAvailability(this.planId).subscribe({
      next:  (fa) => this.feedbackAvailability = fa,
      error: ()   => {}
    });
  }

  private groupByDay(exercises: PlannedExercise[]): TrainingDayGroup[] {
    const map = new Map<string, PlannedExercise[]>();
    for (const ex of exercises) {
      const key = ex.trainingDay ?? 'Alle Tage';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ex);
    }
    return Array.from(map.entries()).map(([dayName, exs]) => ({
      dayName,
      exercises: exs.sort((a, b) => a.order - b.order)
    }));
  }

  /** Klasse für das Tag-Card — Mobilitätsblock erhält eigene Farbe */
  getDayCardClass(index: number, dayName: string): string {
    if (dayName === 'Mobilitätsblock') return 'day-card--mobility';
    const classes = ['day-card--a', 'day-card--b', 'day-card--c', 'day-card--d'];
    return classes[index % classes.length];
  }

  getRpeClass(rpe: number | undefined): string {
    if (!rpe) return 'rpe--neutral';
    if (rpe <= 4) return 'rpe--easy';
    if (rpe <= 6) return 'rpe--moderate';
    if (rpe <= 8) return 'rpe--hard';
    return 'rpe--max';
  }

  activatePlan(): void {
    this.isLoading = true;
    this.trainingService.setPlanStatus(this.planId, true).subscribe({
      next: (res) => {
        this.statusMessage = res.message;
        this.loadPlan();
      },
      error: (err) => {
        this.statusMessage = 'Fehler: ' + (err.error?.message ?? 'Unbekannt');
        this.isLoading = false;
      }
    });
  }

  deactivatePlan(): void {
    this.isLoading = true;
    this.trainingService.setPlanStatus(this.planId, false).subscribe({
      next: (res) => {
        this.statusMessage = res.message;
        this.loadPlan();
      },
      error: (err) => {
        this.statusMessage = 'Fehler: ' + (err.error?.message ?? 'Unbekannt');
        this.isLoading = false;
      }
    });
  }

  confirmDelete(): void { this.showDeleteConfirm = true; }

  deletePlan(): void {
    this.showDeleteConfirm = false;
    this.trainingService.deletePlan(this.planId).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => { this.statusMessage = 'Fehler beim Löschen: ' + (err.error?.message ?? ''); }
    });
  }

  submitFeedback(): void {
    this.isLoading = true;
    this.trainingService.submitFeedback({
      trainingPlanId: this.planId,
      sessionRpe: this.sessionRpe,
      userNote: this.feedbackNote || undefined
    }).subscribe({
      next: (res) => {
        this.showFeedbackModal = false;
        this.feedbackResult    = res;
        this.feedbackNote      = '';
        this.sessionRpe        = 6;
        this.isLoading         = false;
        this.loadPlan();
      },
      error: (err) => {
        this.statusMessage = 'Feedback-Fehler: ' + (err.error?.message ?? 'Unbekannt');
        this.showFeedbackModal = false;
        this.isLoading = false;
      }
    });
  }
}
