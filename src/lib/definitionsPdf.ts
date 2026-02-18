import { jsPDF } from 'jspdf';
import {
  STUDY_TYPE_OPTIONS,
  TIMING_OPTIONS,
  GEOGRAPHIC_SCOPE_OPTIONS,
  RESULT_LEVEL_OPTIONS,
  CAUSALITY_MODE_OPTIONS,
  METHOD_CLASS_OPTIONS,
  ANALYTICAL_SCOPE_OPTIONS,
} from '@/types/index';

interface DefinitionEntry {
  label: string;
  description?: string;
}

interface DefinitionSection {
  title: string;
  entries: DefinitionEntry[];
}

const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 20;
const PAGE_WIDTH = 210; // A4 mm
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const FOOTER_Y = PAGE_HEIGHT - 15;

function buildSections(): DefinitionSection[] {
  return [
    {
      title: 'Study Types',
      entries: STUDY_TYPE_OPTIONS.map((o) => ({ label: o.label, description: o.description })),
    },
    {
      title: 'Causality Modes',
      entries: CAUSALITY_MODE_OPTIONS.map((o) => ({ label: o.label, description: o.description })),
    },
    {
      title: 'Timing',
      entries: TIMING_OPTIONS.map((o) => ({ label: o.label, description: o.description })),
    },
    {
      title: 'Result Levels',
      entries: RESULT_LEVEL_OPTIONS.map((o) => ({ label: o.label, description: o.description })),
    },
    {
      title: 'Method Classes',
      entries: METHOD_CLASS_OPTIONS.map((o) => ({ label: o.label })),
    },
    {
      title: 'Analytical Scope',
      entries: ANALYTICAL_SCOPE_OPTIONS.map((o) => ({ label: o.label })),
    },
    {
      title: 'Geographic Scope',
      entries: GEOGRAPHIC_SCOPE_OPTIONS.map((o) => ({
        label: o.label,
        description: o.description,
      })),
    },
  ];
}

function addPageNumber(doc: jsPDF, pageNum: number, totalPages: number) {
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_WIDTH / 2, FOOTER_Y, { align: 'center' });
  doc.setTextColor(0, 0, 0);
}

export function generateDefinitionsPDF(): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const sections = buildSections();
  let y = 25;
  let pageNum = 1;

  const checkPageBreak = (needed: number) => {
    if (y + needed > FOOTER_Y - 10) {
      doc.addPage();
      pageNum++;
      y = 20;
    }
  };

  // --- Title ---
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MELIAF Study Classifications & Definitions', MARGIN_LEFT, y);
  y += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, MARGIN_LEFT, y);
  doc.setTextColor(0, 0, 0);
  y += 10;

  // --- Sections ---
  for (const section of sections) {
    checkPageBreak(20);

    // Section heading
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 100, 60); // CGIAR green
    doc.text(section.title, MARGIN_LEFT, y);
    doc.setTextColor(0, 0, 0);
    y += 2;

    // Underline
    doc.setDrawColor(0, 100, 60);
    doc.setLineWidth(0.5);
    doc.line(MARGIN_LEFT, y, MARGIN_LEFT + CONTENT_WIDTH, y);
    y += 6;

    // Entries
    for (const entry of section.entries) {
      const descLines = entry.description
        ? doc.splitTextToSize(entry.description, CONTENT_WIDTH - 5)
        : [];
      const blockHeight = 6 + descLines.length * 4;
      checkPageBreak(blockHeight + 4);

      // Label
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(entry.label, MARGIN_LEFT + 2, y);
      y += 5;

      // Description
      if (descLines.length > 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        for (const line of descLines) {
          doc.text(line, MARGIN_LEFT + 4, y);
          y += 4;
        }
        doc.setTextColor(0, 0, 0);
      }

      y += 3;
    }

    y += 4;
  }

  // --- Conditional Logic section ---
  checkPageBreak(40);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 100, 60);
  doc.text('Conditional Logic: Section C (Research Details)', MARGIN_LEFT, y);
  doc.setTextColor(0, 0, 0);
  y += 2;
  doc.setDrawColor(0, 100, 60);
  doc.line(MARGIN_LEFT, y, MARGIN_LEFT + CONTENT_WIDTH, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const condText =
    'Section C (Research Details) is conditionally displayed in the study form. It appears when any of the following conditions are met:';
  const condLines = doc.splitTextToSize(condText, CONTENT_WIDTH);
  for (const line of condLines) {
    doc.text(line, MARGIN_LEFT + 2, y);
    y += 5;
  }
  y += 3;

  const conditions = [
    'Causality Mode is set to C2 (Causal / Counterfactual attribution)',
    'Method Class is set to Quantitative',
    'Method Class is set to Experimental / Quasi-Experimental',
  ];

  for (const cond of conditions) {
    checkPageBreak(8);
    doc.setFont('helvetica', 'bold');
    doc.text('\u2022', MARGIN_LEFT + 4, y);
    doc.setFont('helvetica', 'normal');
    doc.text(cond, MARGIN_LEFT + 10, y);
    y += 6;
  }

  y += 4;
  checkPageBreak(10);
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const noteText =
    'For all other combinations (e.g. C0 Descriptive + Qualitative, C1 Contribution + Mixed), Section C is hidden and its fields are not required.';
  const noteLines = doc.splitTextToSize(noteText, CONTENT_WIDTH);
  for (const line of noteLines) {
    doc.text(line, MARGIN_LEFT + 2, y);
    y += 4;
  }
  doc.setTextColor(0, 0, 0);

  // --- Add page numbers ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageNumber(doc, i, totalPages);
  }

  doc.save('MELIAF-Definitions.pdf');
}
