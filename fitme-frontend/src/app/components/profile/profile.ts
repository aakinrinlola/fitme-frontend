import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TrainingService } from '../../services/training.service';
import { AuthService } from '../../services/auth.service';
import {
  UserProfile,
  BodyScanEntry,
  BodyScanRequest,
  BODY_SCAN_ROWS,
  BodyScanRowMeta
} from '../../models/training.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class Profile implements OnInit {

  profile: UserProfile | null = null;

  // ── Profil-Edit ────────────────────────────────────────────────────────────
  editUsername     = '';
  editEmail        = '';
  editAge:      number | null = null;
  editWeightKg: number | null = null;
  editHeightCm: number | null = null;
  editFitnessLevel = 'BEGINNER';
  editMotivationalMessage = '';
  showBodyScanInDashboard = false;

  // ── Password ───────────────────────────────────────────────────────────────
  oldPassword = '';
  newPassword = '';

  // ── Loading / Status ───────────────────────────────────────────────────────
  isLoadingProfile   = true;
  isSavingProfile    = false;
  isChangingPassword = false;
  isSavingMotivation = false;
  isSavingToggle     = false;

  profileError:    string | null = null;
  profileSuccess:  string | null = null;
  passwordError:   string | null = null;
  passwordSuccess: string | null = null;
  motivationError:   string | null = null;
  motivationSuccess: string | null = null;

  readonly fitnessLevels = [
    { value: 'BEGINNER',     label: 'Anfänger' },
    { value: 'INTERMEDIATE', label: 'Fortgeschritten' },
    { value: 'ADVANCED',     label: 'Experte' }
  ];

  // ── Body Scan ──────────────────────────────────────────────────────────────
  bodyScanHistory: BodyScanEntry[] = [];
  isLoadingBodyScan  = false;
  bodyScanError:   string | null = null;
  bodyScanSuccess: string | null = null;
  isSavingBodyScan = false;
  isDeletingBodyScan = false;

  /** Zeigt das Eingabe-Formular für einen neuen Eintrag */
  showBodyScanForm = false;

  /** Formularmodell für neuen Eintrag */
  newScan: BodyScanRequest = { measuredAt: this.todayIso() };

  /** Metadaten aller Zeilen (Label, Einheit, Richtung) */
  readonly scanRows: BodyScanRowMeta[] = BODY_SCAN_ROWS;

  /** Die letzten 3 Messungen für die Vergleichstabelle */
  get recentScans(): BodyScanEntry[] {
    return this.bodyScanHistory.slice(0, 3);
  }

  /** Alle Messungen (für "Alle anzeigen") */
  showAllScans = false;
  get displayedScans(): BodyScanEntry[] {
    return this.showAllScans ? this.bodyScanHistory : this.recentScans;
  }

  constructor(
    private trainingService: TrainingService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  // ── Profil laden ───────────────────────────────────────────────────────────
  loadProfile(): void {
    this.isLoadingProfile = true;
    this.trainingService.getProfile().subscribe({
      next: p => {
        this.profile                = p;
        this.editUsername           = p.username;
        this.editEmail              = p.email;
        this.editAge                = p.age   || null;
        this.editWeightKg           = p.weightKg || null;
        this.editHeightCm           = p.heightCm || null;
        this.editFitnessLevel       = p.fitnessLevel || 'BEGINNER';
        this.editMotivationalMessage = p.motivationalMessage ?? '';
        this.showBodyScanInDashboard = p.showBodyScanInDashboard;
        this.isLoadingProfile       = false;
        this.loadBodyScanHistory();
      },
      error: () => { this.isLoadingProfile = false; }
    });
  }

  // ── Profil speichern ───────────────────────────────────────────────────────
  saveProfile(): void {
    this.isSavingProfile = true;
    this.profileError    = null;
    this.profileSuccess  = null;

    this.trainingService.updateProfile({
      username:     this.editUsername    || undefined,
      email:        this.editEmail       || undefined,
      age:          this.editAge         ?? undefined,
      weightKg:     this.editWeightKg    ?? undefined,
      heightCm:     this.editHeightCm    ?? undefined,
      fitnessLevel: this.editFitnessLevel
    }).subscribe({
      next: p => {
        this.profile        = p;
        this.profileSuccess = 'Profil erfolgreich gespeichert.';
        this.isSavingProfile = false;
      },
      error: err => {
        this.profileError   = err.error?.message ?? 'Profil konnte nicht gespeichert werden.';
        this.isSavingProfile = false;
      }
    });
  }

  // ── Motivationsnachricht speichern ─────────────────────────────────────────
  saveMotivationalMessage(): void {
    this.isSavingMotivation  = true;
    this.motivationError     = null;
    this.motivationSuccess   = null;

    this.trainingService.updateProfile({
      motivationalMessage: this.editMotivationalMessage.trim() || undefined
    }).subscribe({
      next: p => {
        this.profile             = p;
        this.motivationSuccess   = 'Deine Botschaft wurde gespeichert ✓';
        this.isSavingMotivation  = false;
      },
      error: err => {
        this.motivationError    = err.error?.message ?? 'Botschaft konnte nicht gespeichert werden.';
        this.isSavingMotivation = false;
      }
    });
  }

  // ── Dashboard-Toggle speichern ─────────────────────────────────────────────
  saveBodyScanToggle(): void {
    this.isSavingToggle = true;
    this.trainingService.updateProfile({
      showBodyScanInDashboard: this.showBodyScanInDashboard
    }).subscribe({
      next: p => {
        this.profile = p;
        this.showBodyScanInDashboard = p.showBodyScanInDashboard;
        this.isSavingToggle = false;
      },
      error: () => { this.isSavingToggle = false; }
    });
  }

  // ── Passwort ändern ────────────────────────────────────────────────────────
  changePassword(): void {
    if (!this.oldPassword || !this.newPassword) return;
    this.isChangingPassword = true;
    this.passwordError      = null;
    this.passwordSuccess    = null;

    this.trainingService.changePassword(this.oldPassword, this.newPassword).subscribe({
      next: res => {
        this.passwordSuccess    = res.message;
        this.oldPassword        = '';
        this.newPassword        = '';
        this.isChangingPassword = false;
      },
      error: err => {
        this.passwordError      = err.error?.message ?? 'Passwort konnte nicht geändert werden.';
        this.isChangingPassword = false;
      }
    });
  }

  // ── Body Scan: Historie laden ──────────────────────────────────────────────
  loadBodyScanHistory(): void {
    this.isLoadingBodyScan = true;
    this.trainingService.getBodyScanHistory().subscribe({
      next: entries => {
        this.bodyScanHistory   = entries;
        this.isLoadingBodyScan = false;
      },
      error: () => { this.isLoadingBodyScan = false; }
    });
  }

  // ── Body Scan: Neuen Eintrag speichern ─────────────────────────────────────
  saveBodyScan(): void {
    if (!this.newScan.measuredAt) return;
    this.isSavingBodyScan = true;
    this.bodyScanError    = null;
    this.bodyScanSuccess  = null;

    this.trainingService.saveBodyScan(this.newScan).subscribe({
      next: () => {
        this.bodyScanSuccess  = 'Body-Scan-Eintrag gespeichert ✓';
        this.isSavingBodyScan = false;
        this.showBodyScanForm = false;
        this.newScan          = { measuredAt: this.todayIso() };
        this.loadBodyScanHistory();
      },
      error: err => {
        this.bodyScanError    = err.error?.message ?? 'Eintrag konnte nicht gespeichert werden.';
        this.isSavingBodyScan = false;
      }
    });
  }

  // ── Body Scan: Eintrag löschen ─────────────────────────────────────────────
  deleteBodyScan(id: number): void {
    if (!confirm('Diesen Eintrag wirklich löschen?')) return;
    this.isDeletingBodyScan = true;
    this.trainingService.deleteBodyScan(id).subscribe({
      next: () => {
        this.isDeletingBodyScan = false;
        this.loadBodyScanHistory();
      },
      error: () => { this.isDeletingBodyScan = false; }
    });
  }

  // ── Hilfsmethoden ─────────────────────────────────────────────────────────

  /** Gibt den Wert einer Zeile für einen bestimmten Scan zurück. */
  getScanValue(scan: BodyScanEntry, key: keyof BodyScanEntry): number | null {
    const val = scan[key];
    return typeof val === 'number' ? val : null;
  }

  /**
   * Delta zum vorherigen Scan (Index = Spaltenindex in displayedScans).
   * Gibt null zurück, wenn kein Vorgänger vorhanden oder Werte fehlen.
   */
  getDelta(scanIndex: number, key: keyof BodyScanEntry): number | null {
    const scans = this.displayedScans;
    if (scanIndex >= scans.length - 1) return null;
    const current  = this.getScanValue(scans[scanIndex],     key);
    const previous = this.getScanValue(scans[scanIndex + 1], key);
    if (current == null || previous == null) return null;
    return +(current - previous).toFixed(2);
  }

  /**
   * CSS-Klasse für den Trendpfeil je nach Richtung und Delta.
   * 'trend--good'    = grün
   * 'trend--bad'     = rot
   * 'trend--neutral' = grau
   */
  getTrendClass(delta: number | null, direction: 'less' | 'more' | 'neutral'): string {
    if (delta == null || delta === 0 || direction === 'neutral') return 'trend--neutral';
    const improved = direction === 'more' ? delta > 0 : delta < 0;
    return improved ? 'trend--good' : 'trend--bad';
  }

  /** Pfeil-Symbol (▲ / ▼) für Delta. */
  getTrendArrow(delta: number | null): string {
    if (delta == null || delta === 0) return '';
    return delta > 0 ? '▲' : '▼';
  }

  /** Formatiertes Datum für Spaltenüberschrift. */
  formatScanDate(iso: string): string {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: '2-digit'
    });
  }

  logout(): void {
    this.authService.logout();
  }

  private todayIso(): string {
    return new Date().toISOString().split('T')[0];
  }

  /** Prüft ob mindestens ein Feld im newScan (außer Datum) befüllt ist. */
  get newScanHasValues(): boolean {
    const { measuredAt, ...rest } = this.newScan;
    return Object.values(rest).some(v => v != null);
  }
}
