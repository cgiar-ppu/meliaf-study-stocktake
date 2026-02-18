import { jsPDF, type GState } from 'jspdf';
import { create as createQR } from 'qrcode';
import {
  STUDY_TYPE_OPTIONS,
  TIMING_OPTIONS,
  GEOGRAPHIC_SCOPE_OPTIONS,
  RESULT_LEVEL_OPTIONS,
  CAUSALITY_MODE_OPTIONS,
  METHOD_CLASS_OPTIONS,
  ANALYTICAL_SCOPE_OPTIONS,
} from '@/types/index';
import { CGIAR_LOGO_BASE64 } from './cgiarLogoBase64';

// jsPDF exposes GState as a constructor on the instance but the types
// don't reflect it cleanly — we cast once here and reuse throughout.
function createGState(doc: jsPDF, params: GState): GState {
  return new (doc as unknown as { GState: new (p: GState) => GState }).GState(params);
}

// =============================================================================
// Constants
// =============================================================================

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_LEFT = 24;
const MARGIN_RIGHT = 20;
const CONTENT_LEFT = MARGIN_LEFT;
const CONTENT_WIDTH = PAGE_WIDTH - CONTENT_LEFT - MARGIN_RIGHT;
const HEADER_Y = 15;
const FOOTER_Y = PAGE_HEIGHT - 12;
const CONTENT_TOP = 24;
const CONTENT_BOTTOM = FOOTER_Y - 6;
const SIDEBAR_WIDTH = 3;

// Logo aspect ratio: 500w x 585h → ratio 0.8547
const LOGO_RATIO = 500 / 585;

// Colors (RGB)
const CGIAR_GREEN: RGB = [56, 118, 29];
const CGIAR_GOLD: RGB = [184, 156, 80];
const WHITE: RGB = [255, 255, 255];
const NEAR_BLACK: RGB = [35, 35, 35];
const DARK_GRAY: RGB = [60, 60, 60];
const MID_GRAY: RGB = [120, 120, 120];
const ROW_ALT: RGB = [248, 250, 248];

type RGB = [number, number, number];

// Badge colors matching Dashboard chart palette
const STUDY_TYPE_BADGE: RGB = [0, 102, 51];
const CAUSALITY_BADGE: RGB = [66, 103, 178];
const TIMING_BADGE: RGB = [56, 118, 29];
const RESULT_BADGE: RGB = [184, 156, 80];
const METHOD_BADGE: RGB = [102, 51, 153];
const SCOPE_BADGE: RGB = [46, 139, 130];
const GEO_BADGE: RGB = [204, 119, 34];
const COND_LOGIC_BADGE: RGB = [178, 60, 60];


// =============================================================================
// Types
// =============================================================================

interface DefinitionEntry {
  value: string;
  label: string;
  description?: string;
}

interface DefinitionSection {
  title: string;
  subtitle: string;
  color: RGB;
  entries: DefinitionEntry[];
  twoColumn?: boolean;
}

interface TocEntry {
  title: string;
  page: number;
}

// =============================================================================
// Data
// =============================================================================

function buildSections(): DefinitionSection[] {
  return [
    {
      title: 'Study Types',
      subtitle: 'Ten study types spanning the full cycle of research impact',
      color: STUDY_TYPE_BADGE,
      entries: STUDY_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label, description: o.description })),
    },
    {
      title: 'Causality Modes',
      subtitle: 'Level of causal ambition, from descriptive to counterfactual',
      color: CAUSALITY_BADGE,
      entries: CAUSALITY_MODE_OPTIONS.map((o) => ({ value: o.value, label: o.label, description: o.description })),
    },
    {
      title: 'Timing',
      subtitle: 'When the study takes place relative to the intervention',
      color: TIMING_BADGE,
      entries: TIMING_OPTIONS.map((o) => ({ value: o.value, label: o.label, description: o.description })),
    },
    {
      title: 'Result Levels',
      subtitle: 'Position on the CGIAR impact pathway hierarchy',
      color: RESULT_BADGE,
      entries: RESULT_LEVEL_OPTIONS.map((o) => ({ value: o.value, label: o.label, description: o.description })),
    },
    {
      title: 'Method Classes',
      subtitle: 'Methodological approach \u2014 also determines Section C visibility',
      color: METHOD_BADGE,
      entries: METHOD_CLASS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
      twoColumn: true,
    },
    {
      title: 'Analytical Scope',
      subtitle: 'Level of analysis from innovation to portfolio',
      color: SCOPE_BADGE,
      entries: ANALYTICAL_SCOPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
      twoColumn: true,
    },
    {
      title: 'Geographic Scope',
      subtitle: 'Spatial scale \u2014 determines which location fields appear in the form',
      color: GEO_BADGE,
      entries: GEOGRAPHIC_SCOPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
      twoColumn: true,
    },
  ];
}

// =============================================================================
// Logo helper — preserves correct aspect ratio
// =============================================================================

const LOGO_DATA_URI = `data:image/png;base64,${CGIAR_LOGO_BASE64}`;

/** Draw logo preserving its native 500:585 aspect ratio.
 *  Specify the bounding dimension and whether it's width or height. */
function drawLogo(
  doc: jsPDF,
  x: number,
  y: number,
  fitWidth: number,
  opacity?: number,
) {
  const w = fitWidth;
  const h = w / LOGO_RATIO;
  if (opacity !== undefined && opacity < 1) {
    const gs = createGState(doc, { opacity });
    doc.saveGraphicsState();
    doc.setGState(gs);
    doc.addImage(LOGO_DATA_URI, 'PNG', x, y, w, h);
    doc.restoreGraphicsState();
  } else {
    doc.addImage(LOGO_DATA_URI, 'PNG', x, y, w, h);
  }
  return { w, h };
}

// =============================================================================
// QR Code placeholder
// =============================================================================

function drawQrCode(doc: jsPDF, x: number, y: number, size: number, url: string) {
  const qr = createQR(url, { errorCorrectionLevel: 'M' });
  const moduleCount = qr.modules.size;
  const cellSize = size / moduleCount;

  // Green border + white background (matching existing style)
  doc.setFillColor(...CGIAR_GREEN);
  doc.roundedRect(x - 2, y - 2, size + 4, size + 4, 2, 2, 'F');
  doc.setFillColor(...WHITE);
  doc.roundedRect(x - 1, y - 1, size + 2, size + 2, 1.5, 1.5, 'F');

  // Draw each dark module
  doc.setFillColor(...NEAR_BLACK);
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.modules.get(row, col)) {
        doc.rect(x + col * cellSize, y + row * cellSize, cellSize, cellSize, 'F');
      }
    }
  }
}

// =============================================================================
// Page furniture (applied to every content page)
// =============================================================================

function addWatermark(doc: jsPDF) {
  const wmWidth = 100;
  const cx = (PAGE_WIDTH - wmWidth) / 2;
  const wmHeight = wmWidth / LOGO_RATIO;
  const cy = (PAGE_HEIGHT - wmHeight) / 2 - 5;
  drawLogo(doc, cx, cy, wmWidth, 0.05);
}

function addSidebar(doc: jsPDF) {
  doc.setFillColor(...CGIAR_GREEN);
  doc.rect(0, 0, SIDEBAR_WIDTH, PAGE_HEIGHT, 'F');
}

function addHeader(doc: jsPDF, sectionTitle?: string) {
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MID_GRAY);
  doc.text('MELIAF Study Classifications & Definitions', CONTENT_LEFT, HEADER_Y);
  if (sectionTitle) {
    doc.text(sectionTitle, PAGE_WIDTH - MARGIN_RIGHT, HEADER_Y, { align: 'right' });
  }
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(CONTENT_LEFT, HEADER_Y + 2, PAGE_WIDTH - MARGIN_RIGHT, HEADER_Y + 2);
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(CONTENT_LEFT, FOOTER_Y - 3, PAGE_WIDTH - MARGIN_RIGHT, FOOTER_Y - 3);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MID_GRAY);
  doc.text(
    'v1.0  \u2022  Generated from MELIAF Study Stocktake  \u2022  meliaf-study-stocktake.synapsis-analytics.com',
    CONTENT_LEFT,
    FOOTER_Y,
  );
  doc.text(`${pageNum} / ${totalPages}`, PAGE_WIDTH - MARGIN_RIGHT, FOOTER_Y, { align: 'right' });
}

function addContentPageFurniture(doc: jsPDF, sectionTitle?: string) {
  addSidebar(doc);
  addWatermark(doc);
  addHeader(doc, sectionTitle);
}

// =============================================================================
// Cover Page — clean, white, print-friendly
// =============================================================================

function drawCoverPage(doc: jsPDF) {
  // White background (default) — print-friendly

  // Green accent bar at very top
  doc.setFillColor(...CGIAR_GREEN);
  doc.rect(0, 0, PAGE_WIDTH, 4, 'F');

  // Gold thin line under green bar
  doc.setFillColor(...CGIAR_GOLD);
  doc.rect(0, 4, PAGE_WIDTH, 1, 'F');

  // Logo — centered, proper proportions
  const logoW = 55;
  drawLogo(doc, (PAGE_WIDTH - logoW) / 2, 35, logoW);

  // Title
  const logoH = logoW / LOGO_RATIO;
  let y = 35 + logoH + 18;

  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...CGIAR_GREEN);
  doc.text('MELIAF Study', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 14;
  doc.text('Classifications &', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 14;
  doc.text('Definitions', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 12;

  // Gold divider
  doc.setFillColor(...CGIAR_GOLD);
  doc.rect(65, y, 80, 1, 'F');
  y += 12;

  // Subtitle
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK_GRAY);
  doc.text('Reference Guide for the MELIAF Framework', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 18;

  // Metadata
  doc.setFontSize(11);
  doc.setTextColor(...MID_GRAY);
  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.text(dateStr, PAGE_WIDTH / 2, y, { align: 'center' });
  y += 7;
  doc.text('Version 1.0', PAGE_WIDTH / 2, y, { align: 'center' });

  // Bottom band
  doc.setFillColor(...CGIAR_GREEN);
  doc.rect(0, PAGE_HEIGHT - 20, PAGE_WIDTH, 20, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...WHITE);
  doc.text(
    'Monitoring, Evaluation, Learning, Impact Assessment and Foresight  \u2022  CGIAR',
    PAGE_WIDTH / 2,
    PAGE_HEIGHT - 8,
    { align: 'center' },
  );
}

// =============================================================================
// Table of Contents
// =============================================================================

function drawTableOfContents(doc: jsPDF, toc: TocEntry[]) {
  addContentPageFurniture(doc, 'Contents');
  let y = CONTENT_TOP + 8;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...CGIAR_GREEN);
  doc.text('Contents', CONTENT_LEFT, y);
  y += 4;
  doc.setFillColor(...CGIAR_GOLD);
  doc.rect(CONTENT_LEFT, y, 40, 0.8, 'F');
  y += 16;

  for (const entry of toc) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...NEAR_BLACK);
    doc.text(entry.title, CONTENT_LEFT + 4, y);

    // Dotted leader
    doc.setTextColor(...MID_GRAY);
    doc.setFontSize(11);
    const titleWidth = doc.getTextWidth(entry.title);
    const pageNumX = PAGE_WIDTH - MARGIN_RIGHT - 4;
    const dotsStart = CONTENT_LEFT + 4 + titleWidth + 3;
    const dotsEnd = pageNumX - 10;
    let dx = dotsStart;
    doc.setFontSize(8);
    while (dx < dotsEnd) {
      doc.text('.', dx, y);
      dx += 2.5;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...CGIAR_GREEN);
    doc.text(String(entry.page), pageNumX, y, { align: 'right' });

    doc.link(CONTENT_LEFT, y - 5, CONTENT_WIDTH, 7, { pageNumber: entry.page });
    y += 10;
  }
}

// =============================================================================
// Section Content Rendering
// =============================================================================

/** Draw a section heading inline (no separate page). Returns new y. */
function drawSectionHeading(
  doc: jsPDF,
  section: DefinitionSection,
  y: number,
  compact = false,
): number {
  // Section title
  doc.setFontSize(compact ? 13 : 16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...section.color);
  doc.text(section.title, CONTENT_LEFT, y);
  y += compact ? 2 : 3;

  // Gold underline
  doc.setFillColor(...CGIAR_GOLD);
  doc.rect(CONTENT_LEFT, y, compact ? 28 : 35, 0.7, 'F');
  y += compact ? 4 : 5;

  // Subtitle
  doc.setFontSize(compact ? 7.5 : 8.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...MID_GRAY);
  doc.text(section.subtitle, CONTENT_LEFT, y);
  y += compact ? 5 : 7;

  return y;
}

function renderTwoColumnSection(
  doc: jsPDF,
  section: DefinitionSection,
  startY: number,
): number {
  let y = startY;
  const colWidth = (CONTENT_WIDTH - 8) / 2;
  const entries = section.entries;
  const half = Math.ceil(entries.length / 2);
  const col1 = entries.slice(0, half);
  const col2 = entries.slice(half);

  for (let i = 0; i < Math.max(col1.length, col2.length); i++) {
    if (i % 2 === 1) {
      doc.setFillColor(...ROW_ALT);
      doc.rect(CONTENT_LEFT, y - 3.5, CONTENT_WIDTH, 7, 'F');
    }
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...NEAR_BLACK);
    if (col1[i]) doc.text(`\u2022  ${col1[i].label}`, CONTENT_LEFT + 3, y);
    if (col2[i]) doc.text(`\u2022  ${col2[i].label}`, CONTENT_LEFT + colWidth + 8, y);
    y += 8;
  }
  return y;
}

function renderDetailedSection(
  doc: jsPDF,
  section: DefinitionSection,
  startY: number,
  checkPageBreak: (currentY: number, needed: number, sectionTitle: string) => number,
  compact = false,
): number {
  let y = startY;
  const labelSize = compact ? 9 : 10.5;
  const descSize = compact ? 8 : 9;
  const descLeading = compact ? 3.5 : 4.5;
  const bottomPad = compact ? 3 : 6;
  const topGap = compact ? 4 : 6;

  for (let i = 0; i < section.entries.length; i++) {
    const entry = section.entries[i];
    const isAlt = i % 2 === 1;

    // Estimate block height
    const descLines = entry.description
      ? doc.splitTextToSize(entry.description, CONTENT_WIDTH - 10)
      : [];

    let blockHeight = topGap + descLines.length * descLeading + bottomPad;

    y = checkPageBreak(y, blockHeight, section.title);

    // Alternating row background (skip in compact mode)
    if (!compact && isAlt) {
      doc.setFillColor(...ROW_ALT);
      doc.rect(CONTENT_LEFT - 1, y - 4, CONTENT_WIDTH + 2, blockHeight, 'F');
    }

    // Label
    doc.setFontSize(labelSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NEAR_BLACK);
    doc.text(entry.label, CONTENT_LEFT + 4, y);
    y += topGap;

    // Description
    if (descLines.length > 0) {
      doc.setFontSize(descSize);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK_GRAY);
      for (const line of descLines) {
        doc.text(line, CONTENT_LEFT + 4, y);
        y += descLeading;
      }
    }

    y += bottomPad;
  }

  return y;
}

// =============================================================================
// Decision Tree (Section C Conditional Logic) — using simple rectangles
// =============================================================================

function drawDecisionTree(doc: jsPDF, startY: number): number {
  let y = startY;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...CGIAR_GREEN);
  doc.text('DECISION FLOWCHART', CONTENT_LEFT + 2, y);
  y += 8;

  const centerX = PAGE_WIDTH / 2;
  const boxW = 66;
  const boxH = 14;
  const smallBoxW = 52;
  const smallBoxH = 11;
  const arrowLen = 10;

  // ── Top box: "Study Classification" ──
  doc.setFillColor(...CGIAR_GREEN);
  doc.roundedRect(centerX - boxW / 2, y, boxW, boxH, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('Study Classification', centerX, y + boxH / 2 + 1.5, { align: 'center' });
  y += boxH;

  // Arrow down from top box
  doc.setDrawColor(...NEAR_BLACK);
  doc.setLineWidth(0.5);
  doc.line(centerX, y, centerX, y + arrowLen);
  doc.setFillColor(...NEAR_BLACK);
  doc.triangle(centerX, y + arrowLen + 2, centerX - 2, y + arrowLen - 1, centerX + 2, y + arrowLen - 1, 'F');
  y += arrowLen + 4;

  // ── Condition box (rounded rectangle instead of broken diamond) ──
  const condW = 90;
  const condH = 22;
  doc.setFillColor(255, 250, 235);
  doc.setDrawColor(...CGIAR_GOLD);
  doc.setLineWidth(0.8);
  doc.roundedRect(centerX - condW / 2, y, condW, condH, 3, 3, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NEAR_BLACK);
  doc.text('Causality Mode = C2 (Causal)', centerX, y + 7, { align: 'center' });
  doc.text('OR  Method Class = Quantitative', centerX, y + 12, { align: 'center' });
  doc.text('OR  Method Class = Experimental/Quasi', centerX, y + 17, { align: 'center' });
  y += condH;

  // ── Two arrows: YES (left) and NO (right) ──
  const yesX = centerX - 30;
  const noX = centerX + 30;

  // YES arrow
  doc.setDrawColor(...CGIAR_GREEN);
  doc.setLineWidth(0.7);
  doc.line(yesX, y, yesX, y + arrowLen);
  doc.setFillColor(...CGIAR_GREEN);
  doc.triangle(yesX, y + arrowLen + 2, yesX - 2, y + arrowLen - 1, yesX + 2, y + arrowLen - 1, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...CGIAR_GREEN);
  doc.text('YES', yesX - 6, y + arrowLen / 2 + 1, { align: 'right' });

  // NO arrow
  doc.setDrawColor(180, 50, 50);
  doc.line(noX, y, noX, y + arrowLen);
  doc.setFillColor(180, 50, 50);
  doc.triangle(noX, y + arrowLen + 2, noX - 2, y + arrowLen - 1, noX + 2, y + arrowLen - 1, 'F');
  doc.setTextColor(180, 50, 50);
  doc.text('NO', noX + 6, y + arrowLen / 2 + 1);

  y += arrowLen + 5;

  // ── Result boxes ──
  // YES box
  doc.setFillColor(...CGIAR_GREEN);
  doc.roundedRect(yesX - smallBoxW / 2, y, smallBoxW, smallBoxH, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('Section C: VISIBLE', yesX, y + smallBoxH / 2 + 1.5, { align: 'center' });

  // NO box
  doc.setFillColor(210, 210, 210);
  doc.roundedRect(noX - smallBoxW / 2, y, smallBoxW, smallBoxH, 2, 2, 'F');
  doc.setTextColor(...DARK_GRAY);
  doc.text('Section C: HIDDEN', noX, y + smallBoxH / 2 + 1.5, { align: 'center' });

  y += smallBoxH + 8;
  return y;
}

// =============================================================================
// Back Page (QR code + closing)
// =============================================================================

function drawBackPage(doc: jsPDF) {
  addSidebar(doc);
  addWatermark(doc);

  let y = 80;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...CGIAR_GREEN);
  doc.text('Access the Live Tool', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK_GRAY);
  doc.text('Scan the code or visit the URL below to open the', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 6;
  doc.text('MELIAF Study Stocktake in your browser.', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 16;

  const qrSize = 40;
  drawQrCode(doc, (PAGE_WIDTH - qrSize) / 2, y, qrSize, 'https://meliaf-study-stocktake.synapsis-analytics.com/definitions');
  y += qrSize + 12;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...CGIAR_GREEN);
  const url = 'https://meliaf-study-stocktake.synapsis-analytics.com/definitions';
  doc.text(url, PAGE_WIDTH / 2, y, { align: 'center' });
  doc.link(40, y - 4, 130, 6, { url });
  y += 22;

  doc.setFillColor(...CGIAR_GOLD);
  doc.rect(60, y, 90, 0.6, 'F');
  y += 14;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MID_GRAY);
  doc.text('This document was auto-generated from the MELIAF Study Stocktake application.', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 6;
  doc.text('For the latest definitions, please refer to the live application.', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 6;
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(`Generated: ${dateStr}  |  Version 1.0`, PAGE_WIDTH / 2, y, { align: 'center' });

  y += 22;
  drawLogo(doc, (PAGE_WIDTH - 25) / 2, y, 25);
  y += 25 / LOGO_RATIO + 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MID_GRAY);
  doc.text('Science for Humanity\u2019s Greatest Challenges', PAGE_WIDTH / 2, y, { align: 'center' });
}

// =============================================================================
// Main Export
// =============================================================================

export function generateDefinitionsPDF(): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const sections = buildSections();
  const toc: TocEntry[] = [];
  let currentPage = 1;

  // Helper to add a new content page
  const newContentPage = (sectionTitle?: string) => {
    doc.addPage();
    currentPage++;
    addContentPageFurniture(doc, sectionTitle);
    return CONTENT_TOP;
  };

  // ── Page 1: Cover ──
  drawCoverPage(doc);

  // ── Page 2: TOC (placeholder — filled in later with page numbers) ──
  doc.addPage();
  currentPage++;
  const tocPage = currentPage;

  // ── Shared page-break helper ──
  const checkPageBreak = (currentY: number, needed: number, title: string): number => {
    if (currentY + needed > CONTENT_BOTTOM) {
      return newContentPage(title);
    }
    return currentY;
  };

  // ── Study Types — own page(s) ──
  const studyTypes = sections[0];
  {
    let y = newContentPage(studyTypes.title);
    toc.push({ title: studyTypes.title, page: currentPage });
    doc.outline.add(null, studyTypes.title, { pageNumber: currentPage });
    y = drawSectionHeading(doc, studyTypes, y);
    renderDetailedSection(doc, studyTypes, y, checkPageBreak);
  }

  // ── Other 6 classifications — shared page(s) ──
  const otherSections = sections.slice(1);
  {
    let y = newContentPage('Other Classifications');
    toc.push({ title: 'Other Classifications', page: currentPage });
    doc.outline.add(null, 'Other Classifications', { pageNumber: currentPage });

    for (const section of otherSections) {
      // Estimate minimum space needed for heading + first entry
      y = checkPageBreak(y, 30, section.title);

      y = drawSectionHeading(doc, section, y, true);

      if (section.twoColumn) {
        y = renderTwoColumnSection(doc, section, y);
      } else {
        y = renderDetailedSection(doc, section, y, checkPageBreak, true);
      }

      y += 4; // spacing between sections
    }
  }

  // ── Conditional Logic section ──
  let y = newContentPage('Conditional Logic');
  toc.push({ title: 'Conditional Logic: Section C', page: currentPage });
  doc.outline.add(null, 'Conditional Logic: Section C', { pageNumber: currentPage });

  // Section heading
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...CGIAR_GREEN);
  doc.text('Section C: Research Details', CONTENT_LEFT, y);
  y += 3;
  doc.setFillColor(...CGIAR_GOLD);
  doc.rect(CONTENT_LEFT, y, 35, 0.7, 'F');
  y += 5;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...MID_GRAY);
  doc.text('When Section C (Research Details) appears in the form', CONTENT_LEFT, y);
  y += 10;

  // Explanation text
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...NEAR_BLACK);
  const condText =
    'Section C of the study submission form collects detailed research design information (e.g. unit of analysis, sample size, data collection methods). It is conditionally displayed \u2014 it only appears when the study\u2019s classification warrants additional methodological detail.';
  const condLines = doc.splitTextToSize(condText, CONTENT_WIDTH - 4);
  for (const line of condLines) {
    doc.text(line, CONTENT_LEFT + 2, y);
    y += 5;
  }
  y += 8;

  // Decision tree diagram
  y = drawDecisionTree(doc, y);
  y += 8;

  // Explanatory note box
  doc.setFillColor(245, 245, 250);
  const noteBoxY = y;
  const noteText =
    'For all other combinations (e.g. C0 Descriptive + Qualitative, C1 Contribution + Participatory), Section C is hidden and its fields are not required. This keeps the form streamlined for studies that do not need detailed research design documentation.';
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const noteLines = doc.splitTextToSize(noteText, CONTENT_WIDTH - 16);
  const noteH = noteLines.length * 4.5 + 8;
  doc.roundedRect(CONTENT_LEFT, noteBoxY, CONTENT_WIDTH, noteH, 2, 2, 'F');
  doc.setFillColor(...CAUSALITY_BADGE);
  doc.rect(CONTENT_LEFT, noteBoxY + 2, 1.5, noteH - 4, 'F');
  doc.setTextColor(...DARK_GRAY);
  let ny = noteBoxY + 6;
  for (const line of noteLines) {
    doc.text(line, CONTENT_LEFT + 6, ny);
    ny += 4.5;
  }

  // ── Back page ──
  doc.addPage();
  currentPage++;
  drawBackPage(doc);
  toc.push({ title: 'Access Online', page: currentPage });

  // ── Fill in TOC ──
  doc.setPage(tocPage);
  drawTableOfContents(doc, toc);

  // ── Add footers to all pages except cover ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  doc.save('MELIAF-Definitions.pdf');
}
