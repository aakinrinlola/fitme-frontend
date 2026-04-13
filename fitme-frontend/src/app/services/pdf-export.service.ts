import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TrainingPlanDetail, TrainingDayGroup } from '../models/training.model';

type RGB = [number, number, number];

@Injectable({ providedIn: 'root' })
export class PdfExportService {

  private C_ACCENT:   RGB = [99,  102, 241];
  private C_DARK:     RGB = [17,  24,  39 ];
  private C_GRAY:     RGB = [107, 114, 128];
  private C_LIGHT:    RGB = [249, 250, 251];
  private C_BORDER:   RGB = [229, 231, 235];
  private C_MOBILITY: RGB = [14,  165, 233];
  private C_WHITE:    RGB = [255, 255, 255];

  private DAY_COLORS: RGB[] = [
    [99,  102, 241],
    [16,  185, 129],
    [245, 158, 11 ],
    [139, 92,  246],
  ];

  exportPlan(plan: TrainingPlanDetail, dayGroups: TrainingDayGroup[]): void {
    const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 16;
    let y = margin;

    // ── Metadaten aus Beschreibung extrahieren ───────────────────────────────
    const meta = this.parsePlanMeta(plan.description, dayGroups);

    // ── 1. Header-Banner (erweitert für Ziel/Frequenz/Dauer) ────────────────
    const bannerH = meta.goal || meta.sessionMinutes ? 54 : 46;
    doc.setFillColor(...this.C_ACCENT);
    doc.rect(0, 0, pageW, bannerH, 'F');

    doc.setFillColor(...this.C_WHITE);
    doc.roundedRect(margin, 8, 24, 9, 2, 2, 'F');
    doc.setTextColor(...this.C_ACCENT);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('FitMe', margin + 12, 14, { align: 'center' });

    doc.setTextColor(...this.C_WHITE);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const titleText = plan.planName.length > 45
      ? plan.planName.substring(0, 42) + '...'
      : plan.planName;
    doc.text(titleText, margin, 28);

    // Stats-Zeile: Ziel · x/Woche · min/Einheit
    const statParts: string[] = [];
    if (meta.goal)            statParts.push(`Ziel: ${meta.goal}`);
    if (meta.daysPerWeek)     statParts.push(`${meta.daysPerWeek}x / Woche`);
    if (meta.sessionMinutes)  statParts.push(`${meta.sessionMinutes} min / Einheit`);

    if (statParts.length > 0) {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 210, 255);
      doc.text(statParts.join('   ·   '), margin, 38);
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...this.C_WHITE);
    const dateStr = new Date().toLocaleDateString('de-AT', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
    doc.text(`Exportiert am ${dateStr}`, margin, bannerH - 6);

    y = bannerH + 8;

    // ── 2. RPE-Skala ─────────────────────────────────────────────────────────
    this.drawRpeScale(doc, pageW, margin, y);
    y += 28;

    // ── 3. Beschreibung — kurz, sauber, max 2 Zeilen ─────────────────────────
    if (plan.description) {
      const cleaned = this.cleanDescription(plan.description);
      if (cleaned) {
        const allLines: string[] = doc.splitTextToSize(cleaned, pageW - margin * 2);
        const lines = allLines.slice(0, 2);
        if (allLines.length > 2) lines[1] = lines[1].replace(/\s*\S+$/, '') + ' ...';

        doc.setFontSize(8.5);
        doc.setTextColor(...this.C_GRAY);
        doc.setFont('helvetica', 'italic');
        doc.text(lines, margin, y);
        y += lines.length * 5 + 6;
      }
    }

    // ── 4. Info-Karten ───────────────────────────────────────────────────────
    const trainingDays = dayGroups.filter(d => d.dayName !== 'Mobilitätsblock').length;
    const cards = [
      { label: 'Trainingstage', value: `${trainingDays} Tage` },
      { label: 'Uebungen',      value: `${plan.exercises.length}` },
      { label: 'Laufzeit',      value: `${plan.planDurationWeeks} Wochen` },
      { label: 'Status',        value: plan.active ? 'Aktiv' : 'Inaktiv' },
    ];

    const cardW = (pageW - margin * 2 - 6 * (cards.length - 1)) / cards.length;
    cards.forEach((card, i) => {
      const cx = margin + i * (cardW + 6);
      doc.setFillColor(...this.C_LIGHT);
      doc.setDrawColor(...this.C_BORDER);
      doc.roundedRect(cx, y, cardW, 18, 2, 2, 'FD');
      doc.setFontSize(8);
      doc.setTextColor(...this.C_GRAY);
      doc.setFont('helvetica', 'normal');
      doc.text(card.label, cx + 4, y + 7);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...this.C_DARK);
      doc.text(card.value, cx + 4, y + 14);
    });

    y += 26;

    // ── 4. Trainingstage ─────────────────────────────────────────────────────
    dayGroups.forEach((group, dayIndex) => {
      const isMobility = group.dayName === 'Mobilitätsblock';
      const dayColor: RGB = isMobility
        ? this.C_MOBILITY
        : this.DAY_COLORS[dayIndex % this.DAY_COLORS.length];

      // Seitenumbruch-Logik:
      // Wir brauchen: Tag-Header (12) + Tabellen-Header (10) + mind. 2 Datenzeilen (2×12) + Puffer = 70mm
      // Großzügiger Puffer damit autoTable nicht selbst auf die nächste Seite springt
      const minSpaceForDay = 70;
      const spaceLeft = pageH - margin - y;
      if (spaceLeft < minSpaceForDay) {
        doc.addPage();
        this.addPageFooter(doc, pageW, pageH);
        y = margin;
      }

      // Tag-Header — erst NACH der Seitenprüfung zeichnen
      doc.setFillColor(...dayColor);
      doc.roundedRect(margin, y, pageW - margin * 2, 10, 2, 2, 'F');
      doc.setTextColor(...this.C_WHITE);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(group.dayName, margin + 4, y + 7);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`${group.exercises.length} Uebungen`, pageW - margin - 2, y + 7, { align: 'right' });

      y += 12;

      const hasDesc = group.exercises.some(e => e.description?.trim());

      // ── Fixe Spaltenbreiten
      // Einheitlich für alle Tage: immer gleiche Breiten, kein Umbrechen in Headers
      // nr(8) + name(76) + sets(20) + reps(16) + weight(24) + rest(20) + rpe(14) = 178mm
      const COL_NR     =  8;
      const COL_NAME   = hasDesc ? 44 : 76;
      const COL_SETS   = 20;
      const COL_REPS   = 16;
      const COL_WEIGHT = 24;
      const COL_REST   = 20;
      const COL_RPE    = 14;

      const columns = [
        { header: '#',      dataKey: 'nr'     },
        { header: 'Übung', dataKey: 'name'   },
        { header: 'Sätze', dataKey: 'sets'   },
        { header: 'Wdh',   dataKey: 'reps'   },
        { header: 'Gewicht',dataKey: 'weight' },
        { header: 'Pause', dataKey: 'rest'   },
        { header: 'RPE',   dataKey: 'rpe'    },
        ...(hasDesc ? [{ header: 'Hinweis', dataKey: 'desc' }] : []),
      ];

      const rows = group.exercises.map((ex, j) => ({
        nr:     `${j + 1}`,
        name:   ex.exerciseName,
        sets:   `${ex.sets}`,
        reps:   `${ex.reps}`,
        weight: ex.weightKg > 0 ? `${ex.weightKg} kg` : '—',
        rest:   this.formatRest(ex.restSeconds),
        rpe:    `${ex.targetRpe ?? 7}`,
        desc:   ex.description ?? '',
      }));

      autoTable(doc, {
        startY:      y,
        columns,
        body:        rows,
        margin:      { left: margin, right: margin },
        tableWidth:  pageW - margin * 2,
        rowPageBreak:'avoid',
        showHead:    'everyPage',
        styles: {
          fontSize:    8.5,
          cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
          textColor:   this.C_DARK,
          lineColor:   this.C_BORDER,
          lineWidth:   0.2,
          valign:      'middle',
          overflow:    'linebreak',
        },
        headStyles: {
          fillColor:   dayColor,
          textColor:   this.C_WHITE,
          fontStyle:   'bold',
          fontSize:    8.5,
          cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
          overflow:    'hidden',
        },
        alternateRowStyles: {
          fillColor: this.C_LIGHT,
        },
        columnStyles: {
          nr:     { cellWidth: COL_NR,     halign: 'center' },
          name:   { cellWidth: COL_NAME,   fontStyle: 'bold' },
          sets:   { cellWidth: COL_SETS,   halign: 'center' },
          reps:   { cellWidth: COL_REPS,   halign: 'center' },
          weight: { cellWidth: COL_WEIGHT, halign: 'center' },
          rest:   { cellWidth: COL_REST,   halign: 'center' },
          rpe:    { cellWidth: COL_RPE,    halign: 'center' },
          ...(hasDesc ? { desc: { cellWidth: 'auto', fontSize: 7, textColor: this.C_GRAY } } : {}),
        },
        didParseCell: (data) => {
          if (data.column.dataKey === 'rpe' && data.section === 'body') {
            const rpe = parseInt(data.cell.text[0] ?? '7', 10);
            const color: RGB =
              rpe <= 4 ? [4,   120, 87 ] :
                rpe <= 6 ? [146, 64,  14 ] :
                  rpe <= 8 ? [194, 65,  12 ] :
                    [185, 28,  28 ];
            data.cell.styles.textColor = color;
            data.cell.styles.fontStyle = 'bold';
          }
        },
        didDrawPage: () => {
          this.addPageFooter(doc, pageW, pageH);
        },
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    });

    this.addPageFooter(doc, pageW, pageH);

    const filename = `FitMe_${plan.planName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(filename);
  }

  /** Extrahiert Ziel, Frequenz und Dauer aus der Plandescription. */
  private parsePlanMeta(
    description: string,
    dayGroups: TrainingDayGroup[]
  ): { goal?: string; daysPerWeek?: number; sessionMinutes?: number } {
    const result: { goal?: string; daysPerWeek?: number; sessionMinutes?: number } = {};

    if (description) {
      const goalMatch = description.match(/\|\s*Ziel:\s*([^|]+)/);
      if (goalMatch) result.goal = goalMatch[1].trim();

      const daysMatch = description.match(/\|\s*(\d+)x\/Woche/);
      if (daysMatch) result.daysPerWeek = parseInt(daysMatch[1], 10);

      const minMatch = description.match(/\|\s*(\d+)\s*min\/Einheit/);
      if (minMatch) result.sessionMinutes = parseInt(minMatch[1], 10);
    }

    // Fallback: Anzahl Trainingstage aus dayGroups
    if (!result.daysPerWeek) {
      const n = dayGroups.filter(d => d.dayName !== 'Mobilitätsblock').length;
      if (n > 0) result.daysPerWeek = n;
    }

    return result;
  }

  /** Zeichnet eine kompakte RPE-Skala als farbige Leiste. */
  private drawRpeScale(doc: jsPDF, pageW: number, margin: number, y: number): void {
    const zones: { label: string; sub: string; color: RGB; range: string }[] = [
      { range: '1 – 4', label: 'Leicht',   sub: 'Viele Wdh. möglich',       color: [4,   120, 87 ] },
      { range: '5 – 6', label: 'Moderat',  sub: 'Anstrengend, kontrolliert', color: [146, 64,  14 ] },
      { range: '7 – 8', label: 'Schwer',   sub: '1–2 Wdh. Reserve',         color: [194, 65,  12 ] },
      { range: '9 – 10',label: 'Maximal',  sub: 'Fast keine Reserve',        color: [185, 28,  28 ] },
    ];

    const totalW  = pageW - margin * 2;
    const labelW  = 22; // Platz für "RPE-Skala"-Label links
    const gapW    = 1;  // Abstand zwischen Zonen
    const zoneW   = (totalW - labelW - gapW * 3) / 4; // 4 Zonen, 3 Lücken
    const boxH    = 16;

    // Rahmen + Titel
    doc.setDrawColor(...this.C_BORDER);
    doc.setFillColor(250, 250, 255);
    doc.roundedRect(margin, y, totalW, boxH + 2, 2, 2, 'FD');

    // Titel links
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.C_GRAY);
    doc.text('RPE-Skala', margin + 2, y + 5);

    const startX = margin + labelW;

    zones.forEach((zone, i) => {
      const zx = startX + i * (zoneW + gapW);
      const zy = y + 1;

      // Farbiger Hintergrund
      const bg: RGB = [
        Math.round(zone.color[0] * 0.15 + 240),
        Math.round(zone.color[1] * 0.15 + 240),
        Math.round(zone.color[2] * 0.15 + 240),
      ];
      doc.setFillColor(...bg);
      doc.setDrawColor(...zone.color);
      doc.roundedRect(zx, zy, zoneW, boxH, 1.5, 1.5, 'FD');

      // RPE-Bereich (fett, farbig)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...zone.color);
      doc.text(`RPE ${zone.range}`, zx + zoneW / 2, zy + 5.5, { align: 'center' });

      // Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...this.C_DARK);
      doc.text(zone.label, zx + zoneW / 2, zy + 10, { align: 'center' });

      // Beschreibung
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(...this.C_GRAY);
      doc.text(zone.sub, zx + zoneW / 2, zy + 14, { align: 'center' });
    });
  }

  /**
   * Extrahiert nur den sinnvollen Teil der Beschreibung.
   * Entfernt "KI-generiert:", Tages-Rotations-Hinweise und Doppelungen.
   */
  private cleanDescription(raw: string): string {
    //  KI-generiert: " Prefix entfernen
    let s = raw.replace(/^🤖\s*KI-generiert:\s*/i, '');
    // Alles ab " | Tage:" abschneiden (wird zu lang)
    const cutAt = s.indexOf(' | Tage:');
    if (cutAt > 0) s = s.substring(0, cutAt);
    // Restliche Pipes als Komma umformen
    s = s.replace(/\s*\|\s*/g, '  ·  ').trim();
    return s;
  }

  private addPageFooter(doc: jsPDF, pageW: number, pageH: number): void {
    const curr  = doc.getCurrentPageInfo().pageNumber;
    const total = (doc.internal as any).getNumberOfPages();
    doc.setDrawColor(...this.C_BORDER);
    doc.line(16, pageH - 10, pageW - 16, pageH - 10);
    doc.setFontSize(7);
    doc.setTextColor(...this.C_GRAY);
    doc.setFont('helvetica', 'normal');
    doc.text('Fitme - Trainingsplan', 16, pageH - 5);
    doc.text(`Seite ${curr} / ${total}`, pageW - 16, pageH - 5, { align: 'right' });
  }

  private formatRest(seconds: number): string {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
}
