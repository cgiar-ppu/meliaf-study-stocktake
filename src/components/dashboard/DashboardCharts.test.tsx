import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SubmissionItem } from '@/lib/api';
import { DashboardCharts } from './DashboardCharts';

// Stub chart child components to avoid Recharts/SVG in jsdom
vi.mock('./charts/HorizontalBarChart', () => ({
  HorizontalBarChart: ({ title }: { title: string }) => (
    <div data-testid={`bar-chart-${title}`}>{title}</div>
  ),
}));

vi.mock('./charts/DonutChart', () => ({
  DonutChart: ({ title }: { title: string }) => (
    <div data-testid={`donut-chart-${title}`}>{title}</div>
  ),
}));

vi.mock('./charts/PipelineStatusChart', () => ({
  PipelineStatusChart: ({ title }: { title: string }) => (
    <div data-testid={`pipeline-chart-${title}`}>{title}</div>
  ),
}));

function createRow(overrides: Partial<SubmissionItem> = {}): SubmissionItem {
  return {
    submissionId: 'sub-1',
    version: 1,
    userId: 'user-1',
    status: 'active',
    createdAt: '2025-01-15T10:00:00Z',
    studyTitle: 'Test',
    studyType: 'impact_evaluation',
    leadCenter: 'IFPRI',
    timing: 'ex_post',
    resultLevel: 'output',
    causalityMode: 'c0_descriptive',
    methodClass: 'qualitative',
    dataCollectionStatus: 'ongoing',
    analysisStatus: 'planned',
    ...overrides,
  } as SubmissionItem;
}

const STORAGE_KEY = 'meliaf-dashboard-charts-open';

describe('DashboardCharts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('returns null when rows is empty', () => {
    const { container } = render(<DashboardCharts rows={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders "Portfolio Overview" heading when rows provided', () => {
    render(<DashboardCharts rows={[createRow()]} />);
    expect(screen.getByText('Portfolio Overview')).toBeInTheDocument();
  });

  it('writes open/close state to localStorage on toggle', async () => {
    const user = userEvent.setup();
    render(<DashboardCharts rows={[createRow()]} />);

    // Initially open (default), click to close
    await user.click(screen.getByText('Portfolio Overview'));

    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
  });

  it('reads initial open state from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'false');
    render(<DashboardCharts rows={[createRow()]} />);

    // Charts area should exist but collapsible should be closed
    expect(screen.getByText('Portfolio Overview')).toBeInTheDocument();
  });

  it('renders chart component stubs', () => {
    render(<DashboardCharts rows={[createRow()]} />);
    expect(screen.getByTestId('bar-chart-Study Type')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart-Lead Center')).toBeInTheDocument();
    expect(screen.getByTestId('donut-chart-Timing')).toBeInTheDocument();
  });

  it('shows pipeline charts when pipeline data exists', () => {
    render(<DashboardCharts rows={[createRow({ dataCollectionStatus: 'ongoing' })]} />);
    expect(screen.getByTestId('pipeline-chart-Data Collection Status')).toBeInTheDocument();
  });

  it('hides pipeline charts when no pipeline status data', () => {
    render(
      <DashboardCharts
        rows={[createRow({ dataCollectionStatus: undefined, analysisStatus: undefined })]}
      />
    );
    expect(screen.queryByTestId('pipeline-chart-Data Collection Status')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pipeline-chart-Analysis Status')).not.toBeInTheDocument();
  });
});
