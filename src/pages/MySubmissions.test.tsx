import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MySubmissions from './MySubmissions';

// --- Hoisted mocks ---
const { mockListSubmissions } = vi.hoisted(() => ({
  mockListSubmissions: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  listSubmissions: (...args: unknown[]) => mockListSubmissions(...args),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { email: 'test@cgiar.org', id: 'u1' },
  }),
}));

vi.mock('@/components/submission/SubmissionPreviewSheet', () => ({
  SubmissionPreviewSheet: () => null,
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
    studyTitle: 'Test Study Alpha',
    studyType: 'causal_impact',
    leadCenter: 'IFPRI',
    studyId: 'S001',
    ...overrides,
  };
}

function renderMySubmissions() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MySubmissions />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('MySubmissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeletons while fetching', () => {
    // Never resolve the promise — stays in loading state
    mockListSubmissions.mockReturnValue(new Promise(() => {}));
    renderMySubmissions();
    // Skeleton elements should be rendered
    expect(screen.getByText('Recent Submissions')).toBeInTheDocument();
  });

  it('shows empty state when no submissions', async () => {
    mockListSubmissions.mockResolvedValue({ submissions: [] });
    renderMySubmissions();

    expect(await screen.findByText('No submissions yet')).toBeInTheDocument();
  });

  it('renders submission rows with title and study type', async () => {
    mockListSubmissions.mockImplementation((status: string) => {
      if (status === 'active') {
        return Promise.resolve({
          submissions: [createSubmission()],
        });
      }
      return Promise.resolve({ submissions: [] });
    });
    renderMySubmissions();

    expect(await screen.findByText(/Test Study Alpha/)).toBeInTheDocument();
  });

  it('shows stat cards', async () => {
    mockListSubmissions.mockImplementation((status: string) => {
      if (status === 'active') {
        return Promise.resolve({
          submissions: [createSubmission(), createSubmission({ submissionId: 'sub-2', studyTitle: 'Study Beta' })],
        });
      }
      return Promise.resolve({ submissions: [] });
    });
    renderMySubmissions();

    expect(await screen.findByText('Active Studies')).toBeInTheDocument();
    expect(screen.getByText('Archived')).toBeInTheDocument();
    expect(screen.getByText('Total Submissions')).toBeInTheDocument();
  });

  it('shows error alert on fetch failure', async () => {
    mockListSubmissions.mockRejectedValue(new Error('Network error'));
    renderMySubmissions();

    expect(await screen.findByText(/Failed to load submissions/)).toBeInTheDocument();
  });

  it('shows "New Study" link', () => {
    mockListSubmissions.mockResolvedValue({ submissions: [] });
    renderMySubmissions();
    expect(screen.getByText('New Study')).toBeInTheDocument();
  });

  it('hides archived section when no archived submissions', async () => {
    mockListSubmissions.mockResolvedValue({ submissions: [] });
    renderMySubmissions();

    // Wait for loading to complete
    await screen.findByText('No submissions yet');

    expect(screen.queryByText('Archived Submissions')).not.toBeInTheDocument();
  });

  it('shows archived section when archived submissions exist', async () => {
    mockListSubmissions.mockImplementation((status: string) => {
      if (status === 'archived') {
        return Promise.resolve({
          submissions: [createSubmission({ status: 'archived', studyTitle: 'Archived Study' })],
        });
      }
      return Promise.resolve({ submissions: [] });
    });
    renderMySubmissions();

    expect(await screen.findByText('Archived Submissions')).toBeInTheDocument();
  });

  it('shows version badge on submission row', async () => {
    mockListSubmissions.mockImplementation((status: string) => {
      if (status === 'active') {
        return Promise.resolve({
          submissions: [createSubmission({ version: 3 })],
        });
      }
      return Promise.resolve({ submissions: [] });
    });
    renderMySubmissions();

    expect(await screen.findByText('v3')).toBeInTheDocument();
  });
});
