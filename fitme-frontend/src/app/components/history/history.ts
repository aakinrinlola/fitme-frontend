import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { TrainingService } from '../../services/training.service';
import { SessionHistoryEntry } from '../../models/training.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './history.html',
  styleUrls: ['./history.scss']
})
export class History implements OnInit {
  history$!: Observable<SessionHistoryEntry[]>;
  isLoading = true;
  errorMessage: string | null = null;
  expandedId: number | null = null;

  constructor(private trainingService: TrainingService) {}

  ngOnInit(): void {
    this.history$ = this.trainingService.getHistory();
    this.history$.subscribe({
      next: () => { this.isLoading = false; },
      error: () => {
        this.errorMessage = 'Verlauf konnte nicht geladen werden.';
        this.isLoading = false;
      }
    });
  }

  toggleExpand(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  rpeClass(rpe: number): string {
    if (rpe <= 4) return 'rpe--easy';
    if (rpe <= 6) return 'rpe--moderate';
    if (rpe <= 8) return 'rpe--target';
    return 'rpe--hard';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
