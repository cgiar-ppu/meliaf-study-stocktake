import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Definitions from './Definitions';
import {
  STUDY_TYPE_OPTIONS,
  CAUSALITY_MODE_OPTIONS,
  TIMING_OPTIONS,
  RESULT_LEVEL_OPTIONS,
  METHOD_CLASS_OPTIONS,
  ANALYTICAL_SCOPE_OPTIONS,
  GEOGRAPHIC_SCOPE_OPTIONS,
} from '@/types/index';

// --- Mock PDF generation ---
const { mockGeneratePDF } = vi.hoisted(() => ({
  mockGeneratePDF: vi.fn(),
}));

vi.mock('@/lib/definitionsPdf', () => ({
  generateDefinitionsPDF: mockGeneratePDF,
}));

function renderDefinitions() {
  return render(
    <MemoryRouter>
      <Definitions />
    </MemoryRouter>
  );
}

describe('Definitions page', () => {
  it('renders the page heading', () => {
    renderDefinitions();
    expect(
      screen.getByRole('heading', { name: /study classifications & definitions/i })
    ).toBeInTheDocument();
  });

  it('renders the introductory description', () => {
    renderDefinitions();
    expect(
      screen.getByText(/reference guide for the study types/i)
    ).toBeInTheDocument();
  });

  it('renders the Download PDF button', () => {
    renderDefinitions();
    expect(
      screen.getByRole('button', { name: /download pdf/i })
    ).toBeInTheDocument();
  });

  it('calls generateDefinitionsPDF when Download PDF is clicked', async () => {
    const user = userEvent.setup();
    renderDefinitions();
    await user.click(screen.getByRole('button', { name: /download pdf/i }));
    expect(mockGeneratePDF).toHaveBeenCalledOnce();
  });

  // --- Study Types ---
  it('renders all study type labels', () => {
    renderDefinitions();
    for (const opt of STUDY_TYPE_OPTIONS) {
      expect(screen.getByText(opt.label)).toBeInTheDocument();
    }
  });

  it('renders study type descriptions', () => {
    renderDefinitions();
    for (const opt of STUDY_TYPE_OPTIONS) {
      expect(screen.getByText(opt.description)).toBeInTheDocument();
    }
  });

  // --- Causality Modes ---
  it('renders all causality mode labels and descriptions', () => {
    renderDefinitions();
    for (const opt of CAUSALITY_MODE_OPTIONS) {
      expect(screen.getByText(opt.label)).toBeInTheDocument();
      expect(screen.getByText(opt.description)).toBeInTheDocument();
    }
  });

  // --- Timing ---
  it('renders all timing labels and descriptions', () => {
    renderDefinitions();
    for (const opt of TIMING_OPTIONS) {
      expect(screen.getByText(opt.label)).toBeInTheDocument();
      expect(screen.getByText(opt.description)).toBeInTheDocument();
    }
  });

  // --- Result Levels ---
  it('renders all result level labels and descriptions', () => {
    renderDefinitions();
    for (const opt of RESULT_LEVEL_OPTIONS) {
      expect(screen.getByText(opt.label)).toBeInTheDocument();
      expect(screen.getByText(opt.description)).toBeInTheDocument();
    }
  });

  // --- Method Classes ---
  it('renders all method class labels', () => {
    renderDefinitions();
    for (const opt of METHOD_CLASS_OPTIONS) {
      expect(screen.getAllByText(opt.label).length).toBeGreaterThanOrEqual(1);
    }
  });

  // --- Analytical Scope ---
  it('renders all analytical scope labels', () => {
    renderDefinitions();
    for (const opt of ANALYTICAL_SCOPE_OPTIONS) {
      expect(screen.getByText(opt.label)).toBeInTheDocument();
    }
  });

  // --- Geographic Scope ---
  it('renders all geographic scope labels', () => {
    renderDefinitions();
    for (const opt of GEOGRAPHIC_SCOPE_OPTIONS) {
      expect(screen.getByText(opt.label)).toBeInTheDocument();
    }
  });

  // --- Section headings ---
  it('renders section headings for all definition groups', () => {
    renderDefinitions();
    const sections = [
      'Study Types',
      'Causality Modes',
      'Timing',
      'Result Levels',
      'Method Classes',
      'Analytical Scope',
      'Geographic Scope',
    ];
    for (const title of sections) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
  });

  // --- Conditional Logic ---
  it('renders the Section C conditional logic explanation', () => {
    renderDefinitions();
    expect(
      screen.getByRole('heading', { name: /conditional logic.*section c/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/conditionally displayed/i)
    ).toBeInTheDocument();
  });

  it('lists all three conditions for Section C visibility', () => {
    renderDefinitions();
    expect(screen.getByText(/C2 — Causal/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Quantitative/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Experimental \/ Quasi-Experimental/i).length).toBeGreaterThanOrEqual(1);
  });

  it('explains when Section C is hidden', () => {
    renderDefinitions();
    expect(
      screen.getByText(/C0 Descriptive \+ Qualitative/i)
    ).toBeInTheDocument();
  });
});
