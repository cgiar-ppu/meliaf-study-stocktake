import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './Dashboard';

// --- Hoisted mocks ---
const { mockListAllSubmissions } = vi.hoisted(() => ({
  mockListAllSubmissions: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  listAllSubmissions: (...args: unknown[]) => mockListAllSubmissions(...args),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { email: 'test@cgiar.org', id: 'u1' },
  }),
}));

vi.mock('xlsx', () => ({
  utils: {
    aoa_to_sheet: vi.fn(),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

vi.mock('@/components/dashboard/DashboardCharts', () => ({
  DashboardCharts: () => <div data-testid="dashboard-charts">Charts</div>,
}));

function createSubmission(overrides = {}) {
  return {
    submissionId: 'sub-1',
    version: 1,
    status: 'active',
    userId: 'u1',
    modifiedBy: 'u1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    studyTitle: 'Dashboard Study One',
    studyType: 'causal_impact',
    leadCenter: 'IFPRI',
    studyId: 'D001',
    timing: 't2_endline',
    geographicScope: 'national',
    resultLevel: 'impact',
    startDate: '2024-01-01',
    contactName: 'Jane Doe',
    contactEmail: 'jane@cgiar.org',
    analyticalScope: 'project_intervention',
    causalityMode: 'c2_causal',
    methodClass: 'quantitative',
    primaryIndicator: 'Poverty Reduction, Livelihoods and Jobs',
    expectedEndDate: '2025-12-31',
    dataCollectionStatus: 'ongoing',
    analysisStatus: 'planned',
    funded: 'yes',
    ...overrides,
  };
}

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton while fetching', () => {
    mockListAllSubmissions.mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders data table with submission rows', async () => {
    mockListAllSubmissions.mockResolvedValue({
      submissions: [
        createSubmission(),
        createSubmission({ submissionId: 'sub-2', studyTitle: 'Study Two' }),
      ],
    });
    renderDashboard();

    expect(await screen.findByText('Dashboard Study One')).toBeInTheDocument();
    expect(screen.getByText('Study Two')).toBeInTheDocument();
  });

  it('shows empty state when no submissions', async () => {
    mockListAllSubmissions.mockResolvedValue({ submissions: [] });
    renderDashboard();

    expect(await screen.findByText('No submissions found')).toBeInTheDocument();
  });

  it('shows error alert on fetch failure', async () => {
    mockListAllSubmissions.mockRejectedValue(new Error('Network error'));
    renderDashboard();

    expect(await screen.findByText(/Failed to load submissions/)).toBeInTheDocument();
  });

  it('shows column headers', async () => {
    mockListAllSubmissions.mockResolvedValue({
      submissions: [createSubmission()],
    });
    renderDashboard();

    expect(await screen.findByText('Study Title')).toBeInTheDocument();
    // Column headers also appear in filter bar, so use getAllByText
    expect(screen.getAllByText('Lead Center').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Study Type').length).toBeGreaterThanOrEqual(1);
  });

  it('export button is present', async () => {
    mockListAllSubmissions.mockResolvedValue({
      submissions: [createSubmission()],
    });
    renderDashboard();

    expect(await screen.findByText('Export')).toBeInTheDocument();
  });

  it('pagination controls are rendered', async () => {
    mockListAllSubmissions.mockResolvedValue({
      submissions: [createSubmission()],
    });
    renderDashboard();

    await screen.findByText('Dashboard Study One');
    expect(screen.getByText('Rows per page')).toBeInTheDocument();
    expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
  });

  it('shows submission count badge', async () => {
    mockListAllSubmissions.mockResolvedValue({
      submissions: [createSubmission(), createSubmission({ submissionId: 'sub-2' })],
    });
    renderDashboard();

    expect(await screen.findByText('2 submissions')).toBeInTheDocument();
  });
});
