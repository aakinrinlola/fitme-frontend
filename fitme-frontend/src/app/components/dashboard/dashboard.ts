import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TrainingService } from '../../services/training.service';
import { TrainingPlanSummary, BodyScanEntry, BODY_SCAN_ROWS } from '../../models/training.model';
import { UserInfo } from '../../models/auth.model';

/** Kompakte Vorschau-Zeile für das Dashboard-Widget. */
interface BodyScanPreviewRow {
  label:     string;
  unit:      string;
  latest:    number | null;
  delta:     number | null;
  direction: 'less' | 'more' | 'neutral';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit {
  currentUser: UserInfo | null = null;
  plans: TrainingPlanSummary[] = [];
  isLoading     = true;
  errorMessage: string | null = null;

  motivationalMessage  = '';
  isLoadingMotivation  = true;

  // ── Body Scan ──────────────────────────────────────────────────────────────
  showBodyScanWidget    = false;
  isLoadingBodyScan     = false;
  bodyScanPreviewRows: BodyScanPreviewRow[] = [];

  constructor(
    private authService:    AuthService,
    private trainingService: TrainingService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadPlans();
    this.loadProfileAndBodyScan();
  }

  loadPlans(): void {
    this.isLoading    = true;
    this.errorMessage = null;
    this.trainingService.getMyPlans().subscribe({
      next: plans => { this.plans = plans; this.isLoading = false; },
      error: () => { this.errorMessage = 'Trainingspläne konnten nicht geladen werden.'; this.isLoading = false; }
    });
  }

  /**
   * Lädt Profil und — falls showBodyScanInDashboard && hasBodyScanData — auch die Historie.
   * Kombiniert in einem einzigen Profile-Request (Backend liefert hasBodyScanData bereits mit).
   */
  loadProfileAndBodyScan(): void {
    this.isLoadingMotivation = true;
    this.isLoadingBodyScan   = true;

    this.trainingService.getProfile().subscribe({
      next: profile => {
        this.motivationalMessage = profile.motivationalMessage ?? '';
        this.isLoadingMotivation = false;

        if (profile.showBodyScanInDashboard && profile.hasBodyScanData) {
          this.showBodyScanWidget = true;
          this.trainingService.getBodyScanHistory().subscribe({
            next: entries => {
              this.bodyScanPreviewRows = this.buildPreviewRows(entries);
              this.isLoadingBodyScan   = false;
            },
            error: () => { this.isLoadingBodyScan = false; }
          });
        } else {
          this.showBodyScanWidget = false;
          this.isLoadingBodyScan  = false;
        }
      },
      error: () => {
        this.isLoadingMotivation = false;
        this.isLoadingBodyScan   = false;
      }
    });
  }

  /**
   * Baut die kompakten Vorschau-Zeilen für das Dashboard-Widget.
   * Nur Zeilen mit mindestens einem vorhandenen Wert werden angezeigt.
   * Delta wird aus den letzten zwei Messungen berechnet.
   */
  private buildPreviewRows(entries: BodyScanEntry[]): BodyScanPreviewRow[] {
    if (entries.length === 0) return [];

    const latest  = entries[0];
    const previous = entries.length > 1 ? entries[1] : null;

    return BODY_SCAN_ROWS
      .map(meta => {
        const latestVal   = latest[meta.key] as number | null;
        const previousVal = previous ? (previous[meta.key] as number | null) : null;

        if (latestVal == null) return null;

        const delta = (latestVal != null && previousVal != null)
          ? +(latestVal - previousVal).toFixed(2)
          : null;

        return {
          label:     meta.label,
          unit:      meta.unit,
          latest:    latestVal,
          delta,
          direction: meta.direction
        } as BodyScanPreviewRow;
      })
      .filter((r): r is BodyScanPreviewRow => r !== null)
      // Im Dashboard max. 6 Zeilen für kompakte Vorschau
      .slice(0, 6);
  }

  /** CSS-Klasse für Trendfarbe im Widget. */
  getTrendClass(row: BodyScanPreviewRow): string {
    const { delta, direction } = row;
    if (delta == null || delta === 0 || direction === 'neutral') return 'trend--neutral';
    const improved = direction === 'more' ? delta > 0 : delta < 0;
    return improved ? 'trend--good' : 'trend--bad';
  }

  /** Pfeil-Symbol für Delta. */
  getTrendArrow(delta: number | null): string {
    if (delta == null || delta === 0) return '';
    return delta > 0 ? '▲' : '▼';
  }

  getRemainingDays(activeUntil: string | null | undefined): number {
    if (!activeUntil) return 999;
    const diffMs = new Date(activeUntil).getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  logout(): void {
    this.authService.logout();
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
