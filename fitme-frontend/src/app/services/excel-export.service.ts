import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx-js-style';
import { TrainingPlanDetail, TrainingDayGroup } from '../models/training.model';

// Außenrahmen-Farbe (dunkles Indigo)
const BORDER_COLOR = 'FF3730A3';
const BORDER_THICK: XLSX.CellStyle = {
  border: {
    top:    { style: 'medium', color: { rgb: BORDER_COLOR } },
    bottom: { style: 'medium', color: { rgb: BORDER_COLOR } },
    left:   { style: 'medium', color: { rgb: BORDER_COLOR } },
    right:  { style: 'medium', color: { rgb: BORDER_COLOR } },
  }
};

@Injectable({ providedIn: 'root' })
export class ExcelExportService {

  exportPlan(plan: TrainingPlanDetail, dayGroups: TrainingDayGroup[]): void {
    const wb = XLSX.utils.book_new();

    // ── Ein Tabellenblatt pro Trainingstag ───────────────────────────────────
    for (const group of dayGroups) {
      const isMobility = group.dayName === 'Mobilitätsblock';
      const rows = this.buildRows(group, isMobility);
      const ws   = XLSX.utils.aoa_to_sheet(rows);

      this.applyColumnWidths(ws, isMobility);
      // Erste zwei Zeilen (Titel + Spaltenüberschriften) einfrieren
      ws['!freeze'] = { xSplit: 0, ySplit: 2 };

      const sheetName = group.dayName.replace(/[:\\\/\?\*\[\]]/g, '').substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }

    // ── Übersichtsblatt (alle Tage zusammen) ────────────────────────────────
    const overview = this.buildOverviewSheet(plan, dayGroups);
    XLSX.utils.book_append_sheet(wb, overview, 'Übersicht');

    const filename = `FitMe_${plan.planName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  // ── Zeilen für einen Trainingstag ─────────────────────────────────────────

  private buildRows(group: TrainingDayGroup, isMobility: boolean): any[][] {
    const weeks = ['Woche 1', 'Woche 2', 'Woche 3', 'Woche 4'];

    const title = [`📋 ${group.dayName}`];

    const header = isMobility
      ? ['#', 'Übung', 'Ausführung', 'Sätze', 'Wdh / Sek', 'Pause (s)', ...weeks.map(w => `${w} — Notiz`)]
      : ['#', 'Übung', 'Beschreibung', 'Sätze', 'Wdh', 'Gewicht (kg)', 'Pause (s)', 'Ziel-RPE',
         ...weeks.map(w => `${w} — Endgewicht (kg)`)];

    const dataRows = group.exercises.map((ex, i) => {
      const base = isMobility
        ? [i + 1, ex.exerciseName, ex.description ?? '', ex.sets, ex.reps, ex.restSeconds]
        : [i + 1, ex.exerciseName, ex.description ?? '', ex.sets, ex.reps,
           ex.weightKg > 0 ? ex.weightKg : '', ex.restSeconds, ex.targetRpe ?? 7];
      return [...base, '', '', '', ''];
    });

    return [title, header, ...dataRows];
  }

  // ── Übersichtsblatt ───────────────────────────────────────────────────────

  private buildOverviewSheet(plan: TrainingPlanDetail, dayGroups: TrainingDayGroup[]): XLSX.WorkSheet {
    const rows: any[][] = [];

    rows.push([`FitMe Trainingsplan: ${plan.planName}`]);
    rows.push([`Laufzeit: ${plan.planDurationWeeks} Wochen`, '', `Exportiert: ${new Date().toLocaleDateString('de-AT')}`]);
    rows.push([]);

    // Startzeilen je Tag-Block merken (0-basiert)
    const blocks: { startRow: number; endRow: number }[] = [];
    const NUM_COLS = 12;

    for (const group of dayGroups) {
      const isMobility = group.dayName === 'Mobilitätsblock';
      const blockStart = rows.length;

      // Tag-Header
      rows.push([`▶ ${group.dayName}`, '', '', '', '', '', '', '', 'Woche 1', 'Woche 2', 'Woche 3', 'Woche 4']);

      const colHeader = isMobility
        ? ['#', 'Übung', 'Ausführung', 'Sätze', 'Wdh / Sek', 'Pause (s)', '', '',
           'Woche 1 — Notiz', 'Woche 2 — Notiz', 'Woche 3 — Notiz', 'Woche 4 — Notiz']
        : ['#', 'Übung', 'Beschreibung', 'Sätze', 'Wdh', 'Gewicht (kg)', 'Pause (s)', 'Ziel-RPE',
           'Woche 1 — Endgewicht (kg)', 'Woche 2 — Endgewicht (kg)', 'Woche 3 — Endgewicht (kg)', 'Woche 4 — Endgewicht (kg)'];
      rows.push(colHeader);

      for (const [i, ex] of group.exercises.entries()) {
        const base = isMobility
          ? [i + 1, ex.exerciseName, ex.description ?? '', ex.sets, ex.reps, ex.restSeconds, '', '']
          : [i + 1, ex.exerciseName, ex.description ?? '', ex.sets, ex.reps,
             ex.weightKg > 0 ? ex.weightKg : '', ex.restSeconds, ex.targetRpe ?? 7];
        rows.push([...base, '', '', '', '']);
      }

      const blockEnd = rows.length - 1; // letzte Datenzeile (vor Leerzeile)
      blocks.push({ startRow: blockStart, endRow: blockEnd });

      rows.push([]); // Leerzeile zwischen Tagen
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    this.applyColumnWidths(ws, false, true);

    // Außenrahmen um jeden Tag-Block setzen
    for (const block of blocks) {
      this.applyOuterBorder(ws, block.startRow, block.endRow, NUM_COLS);
    }

    return ws;
  }

  // ── Außenrahmen um einen Zellbereich ─────────────────────────────────────

  private applyOuterBorder(
    ws: XLSX.WorkSheet,
    startRow: number,
    endRow: number,
    numCols: number
  ): void {
    const top    = { style: 'medium' as const, color: { rgb: BORDER_COLOR } };
    const bottom = { style: 'medium' as const, color: { rgb: BORDER_COLOR } };
    const left   = { style: 'medium' as const, color: { rgb: BORDER_COLOR } };
    const right  = { style: 'medium' as const, color: { rgb: BORDER_COLOR } };

    for (let r = startRow; r <= endRow; r++) {
      for (let c = 0; c < numCols; c++) {
        const isTop    = r === startRow;
        const isBottom = r === endRow;
        const isLeft   = c === 0;
        const isRight  = c === numCols - 1;

        if (!isTop && !isBottom && !isLeft && !isRight) continue;

        const addr = XLSX.utils.encode_cell({ r, c });

        // Zelle anlegen falls leer
        if (!ws[addr]) ws[addr] = { t: 'z', v: '' };
        if (!ws[addr].s) ws[addr].s = {};
        if (!ws[addr].s.border) ws[addr].s.border = {};

        if (isTop)    ws[addr].s.border.top    = top;
        if (isBottom) ws[addr].s.border.bottom = bottom;
        if (isLeft)   ws[addr].s.border.left   = left;
        if (isRight)  ws[addr].s.border.right  = right;
      }
    }
  }

  // ── Spaltenbreiten ────────────────────────────────────────────────────────

  private applyColumnWidths(ws: XLSX.WorkSheet, isMobility: boolean, isOverview = false): void {
    const weekColW = { wch: 26 };
    if (isOverview) {
      ws['!cols'] = [
        { wch: 4 }, { wch: 30 }, { wch: 35 }, { wch: 7 }, { wch: 7 },
        { wch: 14 }, { wch: 10 }, { wch: 10 },
        weekColW, weekColW, weekColW, weekColW,
      ];
    } else if (isMobility) {
      ws['!cols'] = [
        { wch: 4 }, { wch: 30 }, { wch: 40 }, { wch: 7 }, { wch: 10 },
        { wch: 10 },
        weekColW, weekColW, weekColW, weekColW,
      ];
    } else {
      ws['!cols'] = [
        { wch: 4 }, { wch: 30 }, { wch: 35 }, { wch: 7 }, { wch: 7 },
        { wch: 14 }, { wch: 10 }, { wch: 10 },
        weekColW, weekColW, weekColW, weekColW,
      ];
    }
  }
}
