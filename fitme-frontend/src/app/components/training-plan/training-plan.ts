import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TrainingService } from '../../services/training.service';
import { PdfExportService } from '../../services/pdf-export.service';
import {
  FeedbackAvailability, PlannedExercise,
  SessionFeedbackResponse, TrainingDayGroup, TrainingPlanDetail
} from '../../models/training.model';

@Component({
  selector: 'app-training-plan',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './training-plan.html',
  styleUrls: ['./training-plan.scss']
})
export class TrainingPlan implements OnInit {

  plan: TrainingPlanDetail | null = null;
  dayGroups: TrainingDayGroup[] = [];
  feedbackAvailability: FeedbackAvailability | null = null;

  isLoading        = false;
  isDeleting       = false;
  isTogglingStatus = false;
  isExportingPdf   = false;

  statusMessage:  string | null = null;
  errorMessage:   string | null = null;
  successMessage: string | null = null;

  showDeleteConfirm = false;
  showFeedbackModal = false;

  sessionRpe   = 6;
  feedbackNote = '';
  feedbackResult: SessionFeedbackResponse | null = null;

  planId!: number;

  constructor(
    private route:           ActivatedRoute,
    private router:          Router,
    private trainingService: TrainingService,
    private pdfExport:       PdfExportService
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

  // ── PDF-Export ────────────────────────────────────────────────────────────

  exportPdf(): void {
    if (!this.plan) return;
    this.isExportingPdf = true;
    try {
      this.pdfExport.exportPlan(this.plan, this.dayGroups);
    } finally {
      setTimeout(() => this.isExportingPdf = false, 800);
    }
  }

  // ── Getter / Hilfsmethoden für HTML ──────────────────────────────────────

  get isMultiDayPlan(): boolean { return this.dayGroups.length > 1; }

  cancelDelete():       void { this.showDeleteConfirm = false; }
  openDeleteConfirm():  void { this.showDeleteConfirm = true;  }
  confirmDelete():      void { this.deletePlan(); }

  toggleActiveStatus(): void {
    if (!this.plan) return;
    if (this.plan.active) this.deactivatePlan();
    else                  this.activatePlan();
  }

  getActiveDaysRemaining(): number | null {
    if (!this.plan?.activeUntil) return null;
    const diff = new Date(this.plan.activeUntil).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86_400_000));
  }

  formatActiveUntil(): string {
    if (!this.plan?.activeUntil) return '';
    return new Date(this.plan.activeUntil).toLocaleDateString('de-AT');
  }

  formatNextFeedback(): string {
    const d = this.feedbackAvailability?.nextFeedbackAvailableAt ?? this.plan?.nextFeedbackAvailableAt;
    if (!d) return '';
    return new Date(d).toLocaleDateString('de-AT');
  }

  formatRest(seconds: number): string {
    if (!seconds) return '—';
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }

  dayColorClass(index: number): string {
    return this.getDayCardClass(index, this.dayGroups[index]?.dayName ?? '');
  }

  getDayCardClass(index: number, dayName: string): string {
    if (dayName === 'Mobilitätsblock') return 'day-card--mobility';
    return ['day-card--a', 'day-card--b', 'day-card--c', 'day-card--d'][index % 4];
  }

  getRpeClass(rpe: number | undefined): string {
    if (!rpe) return 'rpe--neutral';
    if (rpe <= 4) return 'rpe--easy';
    if (rpe <= 6) return 'rpe--moderate';
    if (rpe <= 8) return 'rpe--hard';
    return 'rpe--max';
  }

  // ── Aktionen ──────────────────────────────────────────────────────────────

  activatePlan(): void {
    this.isTogglingStatus = true;
    this.trainingService.setPlanStatus(this.planId, true).subscribe({
      next:  (res: any) => { this.statusMessage = res.message; this.isTogglingStatus = false; this.loadPlan(); },
      error: (err: any) => { this.errorMessage = 'Fehler: ' + (err.error?.message ?? 'Unbekannt'); this.isTogglingStatus = false; }
    });
  }

  deactivatePlan(): void {
    this.isTogglingStatus = true;
    this.trainingService.setPlanStatus(this.planId, false).subscribe({
      next:  (res: any) => { this.statusMessage = res.message; this.isTogglingStatus = false; this.loadPlan(); },
      error: (err: any) => { this.errorMessage = 'Fehler: ' + (err.error?.message ?? 'Unbekannt'); this.isTogglingStatus = false; }
    });
  }

  deletePlan(): void {
    this.isDeleting       = true;
    this.showDeleteConfirm = false;
    this.trainingService.deletePlan(this.planId).subscribe({
      next:  () => this.router.navigate(['/dashboard']),
      error: (err: any) => { this.errorMessage = 'Fehler: ' + (err.error?.message ?? ''); this.isDeleting = false; }
    });
  }

  submitFeedback(): void {
    this.isLoading = true;
    this.trainingService.submitFeedback({
      trainingPlanId: this.planId,
      sessionRpe: this.sessionRpe,
      userNote: this.feedbackNote || undefined
    }).subscribe({
      next: (res: SessionFeedbackResponse) => {
        this.showFeedbackModal = false;
        this.feedbackResult    = res;
        this.feedbackNote      = '';
        this.sessionRpe        = 6;
        this.isLoading         = false;
        this.loadPlan();
      },
      error: (err: any) => {
        this.errorMessage      = 'Feedback-Fehler: ' + (err.error?.message ?? 'Unbekannt');
        this.showFeedbackModal = false;
        this.isLoading         = false;
      }
    });
  }
}
