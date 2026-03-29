import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TrainingService } from '../../services/training.service';
import { TrainingPlanDetail, TrainingDayGroup } from '../../models/training.model';

@Component({
  selector: 'app-training-plan',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './training-plan.html',
  styleUrls: ['./training-plan.scss']
})
export class TrainingPlan implements OnInit {
  plan: TrainingPlanDetail | null = null;
  planId!: number;
  isLoading     = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  /** Gruppierende Ansicht für mehrtägige KI-Pläne */
  dayGroups: TrainingDayGroup[] = [];
  isMultiDayPlan = false;

  /** Delete state */
  showDeleteConfirm = false;
  isDeleting        = false;

  /** Status-Toggle state */
  isTogglingStatus = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private trainingService: TrainingService
  ) {}

  ngOnInit(): void {
    this.planId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadPlan();
  }

  loadPlan(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.trainingService.getPlan(this.planId).subscribe({
      next: plan => {
        this.plan = plan;
        this.dayGroups = this.groupByDay(plan);
        this.isMultiDayPlan = this.dayGroups.length > 1 ||
          (this.dayGroups.length === 1 && this.dayGroups[0].dayName !== '');
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Trainingsplan konnte nicht geladen werden.';
        this.isLoading = false;
      }
    });
  }

  // ── Status-Toggle ─────────────────────────────────────────────────

  toggleActiveStatus(): void {
    if (!this.plan || this.isTogglingStatus) return;

    const newStatus = !this.plan.active;
    this.isTogglingStatus = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.trainingService.setActiveStatus(this.planId, newStatus).subscribe({
      next: (res) => {
        if (this.plan) {
          this.plan = { ...this.plan, active: res.active, activeUntil: res.activeUntil };
        }
        this.successMessage = res.message;
        this.isTogglingStatus = false;
        // Erfolgsmeldung nach 3 Sekunden ausblenden
        setTimeout(() => { this.successMessage = null; }, 3000);
      },
      error: () => {
        this.errorMessage = 'Status konnte nicht geändert werden. Bitte versuche es erneut.';
        this.isTogglingStatus = false;
      }
    });
  }

  // ── Delete ───────────────────────────────────────────────────────

  openDeleteConfirm(): void  { this.showDeleteConfirm = true; }
  cancelDelete(): void       { if (!this.isDeleting) this.showDeleteConfirm = false; }

  confirmDelete(): void {
    this.isDeleting = true;
    this.trainingService.deletePlan(this.planId).subscribe({
      next:  () => this.router.navigate(['/dashboard']),
      error: () => {
        this.errorMessage = 'Plan konnte nicht gelöscht werden.';
        this.isDeleting = false;
        this.showDeleteConfirm = false;
      }
    });
  }

  // ── Hilfsmethoden ────────────────────────────────────────────────

  /**
   * Gibt die verbleibenden aktiven Tage zurück.
   * Null = kein Ablaufdatum gesetzt, negativ = bereits abgelaufen.
   */
  getActiveDaysRemaining(): number | null {
    if (!this.plan?.activeUntil) return null;
    const until = new Date(this.plan.activeUntil);
    const diffMs = until.getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  /** Formatiert das activeUntil-Datum für die Anzeige */
  formatActiveUntil(): string {
    if (!this.plan?.activeUntil) return '';
    return new Date(this.plan.activeUntil).toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  private groupByDay(plan: TrainingPlanDetail): TrainingDayGroup[] {
    const map = new Map<string, TrainingDayGroup>();
    for (const ex of plan.exercises) {
      const key = ex.trainingDay ?? '';
      if (!map.has(key)) map.set(key, { dayName: key, exercises: [] });
      map.get(key)!.exercises.push(ex);
    }
    return Array.from(map.values()).sort((a, b) => a.dayName.localeCompare(b.dayName));
  }

  formatRest(seconds: number): string {
    if (seconds >= 60) return `${Math.floor(seconds / 60)} min`;
    return `${seconds}s`;
  }

  dayColorClass(index: number): string {
    return ['day-card--a', 'day-card--b', 'day-card--c', 'day-card--d'][index % 4];
  }
}
