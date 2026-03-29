import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  isLoading = true;
  errorMessage: string | null = null;

  /** Übungen nach Trainingstag gruppiert (für mehrtägige KI-Pläne) */
  dayGroups: TrainingDayGroup[] = [];

  /** true = mehrtägiger Plan, false = flache Übungsliste (manuell erstellt) */
  isMultiDayPlan = false;

  constructor(
    private route: ActivatedRoute,
    private trainingService: TrainingService
  ) {}

  ngOnInit(): void {
    this.planId = Number(this.route.snapshot.paramMap.get('id'));

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

  /**
   * Gruppiert PlannedExercises nach trainingDay.
   * Übungen ohne trainingDay (manuell erstellt) landen in einer einzigen Gruppe mit leerem dayName.
   */
  private groupByDay(plan: TrainingPlanDetail): TrainingDayGroup[] {
    const map = new Map<string, TrainingDayGroup>();

    for (const ex of plan.exercises) {
      const key = ex.trainingDay ?? '';
      if (!map.has(key)) {
        map.set(key, { dayName: key, exercises: [] });
      }
      map.get(key)!.exercises.push(ex);
    }

    // Sortierung: Tag A → Tag B → Tag C → …
    return Array.from(map.values()).sort((a, b) => a.dayName.localeCompare(b.dayName));
  }

  formatRest(seconds: number): string {
    if (seconds >= 60) return `${Math.floor(seconds / 60)} min`;
    return `${seconds}s`;
  }

  /** Gibt eine Farbe/Klasse für den Tages-Header zurück */
  dayColorClass(index: number): string {
    const classes = ['day-card--a', 'day-card--b', 'day-card--c', 'day-card--d'];
    return classes[index % classes.length];
  }
}
