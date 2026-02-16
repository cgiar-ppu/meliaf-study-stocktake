import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SubmissionPreviewSheet } from './SubmissionPreviewSheet';

const { mockGetHistory, mockDeleteSubmission, mockRestoreSubmission, mockToast } = vi.hoisted(
  () => ({
    mockGetHistory: vi.fn(),
    mockDeleteSubmission: vi.fn(),
    mockRestoreSubmission: vi.fn(),
    mockToast: vi.fn(),
  })
);

vi.mock('@/lib/api', () => ({
  getSubmissionHistory: mockGetHistory,
  deleteSubmission: mockDeleteSubmission,
  restoreSubmission: mockRestoreSubmission,
  listFiles: vi.fn().mockResolvedValue({ files: [] }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockSubmission = {
  submissionId: 'sub-1',
  version: 1,
  userId: 'user-1',
  status: 'active',
  createdAt: '2025-01-15T10:00:00Z',
  studyId: 'STD-001',
  studyTitle: 'Test Study',
  leadCenter: 'IFPRI',
  contactName: 'John Doe',
  contactEmail: 'john@cgiar.org',
  otherCenters: [],
  studyType: 'impact_evaluation',
  causalityMode: 'c0_descriptive',
  methodClass: 'qualitative',
};

function renderSheet(
  props: Partial<React.ComponentProps<typeof SubmissionPreviewSheet>> = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const defaultProps = {
    submissionId: 'sub-1',
    onClose: vi.fn(),
    onEdit: vi.fn(),
    mode: 'active' as const,
    ...props,
  };

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <SubmissionPreviewSheet {...defaultProps} />
      </QueryClientProvider>
    ),
    props: defaultProps,
  };
}

describe('SubmissionPreviewSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeletons while fetching', () => {
    mockGetHistory.mockReturnValue(new Promise(() => {})); // never resolves
    renderSheet();
    // Skeletons render as divs with specific classes
    const container = document.querySelector('.space-y-4');
    expect(container).toBeInTheDocument();
  });

  it('shows error alert on fetch failure', async () => {
    mockGetHistory.mockRejectedValue(new Error('Network error'));
    renderSheet();

    await waitFor(() => {
      expect(screen.getByText('Failed to load submission. Please try again.')).toBeInTheDocument();
    });
  });

  it('renders submission data when loaded', async () => {
    mockGetHistory.mockResolvedValue({ versions: [mockSubmission] });
    renderSheet();

    await waitFor(() => {
      expect(screen.getByText('Test Study')).toBeInTheDocument();
    });
  });

  it('shows Archive and Edit buttons in active mode', async () => {
    mockGetHistory.mockResolvedValue({ versions: [mockSubmission] });
    renderSheet({ mode: 'active' });

    await waitFor(() => {
      expect(screen.getByText('Archive')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
  });

  it('shows Unarchive button in archived mode', async () => {
    const archivedSubmission = { ...mockSubmission, status: 'archived' };
    mockGetHistory.mockResolvedValue({ versions: [archivedSubmission] });
    renderSheet({ mode: 'archived' });

    await waitFor(() => {
      expect(screen.getByText('Unarchive')).toBeInTheDocument();
    });
  });

  it('calls onEdit when Edit button is clicked', async () => {
    const user = userEvent.setup();
    mockGetHistory.mockResolvedValue({ versions: [mockSubmission] });
    const { props } = renderSheet();

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Edit'));
    expect(props.onEdit).toHaveBeenCalledWith('sub-1');
  });

  it('shows title with study title and ID when loaded', async () => {
    mockGetHistory.mockResolvedValue({ versions: [mockSubmission] });
    renderSheet();

    await waitFor(() => {
      expect(screen.getByText('Test Study · STD-001')).toBeInTheDocument();
    });
  });

  it('does not render sheet when submissionId is null', () => {
    mockGetHistory.mockResolvedValue({ versions: [] });
    renderSheet({ submissionId: null });
    expect(screen.queryByText('Submission Preview')).not.toBeInTheDocument();
  });
});
