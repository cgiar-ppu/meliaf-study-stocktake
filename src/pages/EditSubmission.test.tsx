import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// --- Hoisted mocks ---
const { mockGetSubmission, mockTransform } = vi.hoisted(() => ({
  mockGetSubmission: vi.fn(),
  mockTransform: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  getSubmission: (...args: unknown[]) => mockGetSubmission(...args),
}));

vi.mock('@/lib/transformSubmission', () => ({
  transformSubmissionToFormData: (...args: unknown[]) => mockTransform(...args),
}));

vi.mock('@/components/form/StudyForm', () => ({
  StudyForm: (props: { mode: string; submissionId?: string }) => (
    <div data-testid="study-form" data-mode={props.mode} data-submission-id={props.submissionId}>
      StudyForm
    </div>
  ),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { email: 'test@cgiar.org', id: 'u1' },
  }),
}));

import EditSubmission from './EditSubmission';

function renderEditSubmission(submissionId = 'sub-123') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/submit/${submissionId}`]}>
        <Routes>
          <Route path="/submit/:submissionId" element={<EditSubmission />} />
          <Route path="/submit" element={<EditSubmission />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const mockSubmission = {
  submissionId: 'sub-123',
  version: 2,
  status: 'active',
  userId: 'u1',
  modifiedBy: 'u1',
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T12:00:00Z',
  studyTitle: 'Test Study',
  studyType: 'causal_impact',
  leadCenter: 'IFPRI',
  contactName: 'Jane',
  contactEmail: 'jane@cgiar.org',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EditSubmission', () => {
  it('shows loading skeletons while fetching', () => {
    // Never resolve — stays loading
    mockGetSubmission.mockReturnValue(new Promise(() => {}));

    renderEditSubmission();

    // Skeletons render as generic elements; check that StudyForm is NOT rendered
    expect(screen.queryByTestId('study-form')).not.toBeInTheDocument();
  });

  it('shows error alert when getSubmission rejects', async () => {
    mockGetSubmission.mockRejectedValue(new Error('Not found'));

    renderEditSubmission();

    expect(await screen.findByText(/Failed to load submission/)).toBeInTheDocument();
    expect(screen.getByText('Back to Submissions')).toBeInTheDocument();
  });

  it('renders StudyForm in edit mode on success', async () => {
    mockGetSubmission.mockResolvedValue(mockSubmission);
    const formData = { studyTitle: 'Test Study', leadCenter: 'IFPRI' };
    mockTransform.mockReturnValue(formData);

    renderEditSubmission();

    const form = await screen.findByTestId('study-form');
    expect(form).toHaveAttribute('data-mode', 'edit');
    expect(form).toHaveAttribute('data-submission-id', 'sub-123');
    expect(screen.getByText(/Test Study/)).toBeInTheDocument();
    expect(screen.getByText(/v2/)).toBeInTheDocument();
  });

  it('shows error when transform returns undefined', async () => {
    mockGetSubmission.mockResolvedValue(mockSubmission);
    mockTransform.mockReturnValue(undefined);

    renderEditSubmission();

    expect(await screen.findByText(/Failed to load submission/)).toBeInTheDocument();
  });
});
