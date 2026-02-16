import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StudyForm } from './StudyForm';

// --- Hoisted mocks ---
const {
  mockSubmitStudy,
  mockUpdateSubmission,
  mockNavigate,
  mockToast,
  mockHasDraft,
  mockLoadDraft,
  mockClearDraft,
} = vi.hoisted(() => ({
  mockSubmitStudy: vi.fn(),
  mockUpdateSubmission: vi.fn(),
  mockNavigate: vi.fn(),
  mockToast: vi.fn(),
  mockHasDraft: vi.fn(() => false),
  mockLoadDraft: vi.fn(() => null),
  mockClearDraft: vi.fn(),
}));

// Mock child section components as stubs to focus on orchestration
vi.mock('./SectionA', () => ({
  SectionA: () => <div data-testid="section-a">SectionA</div>,
}));
vi.mock('./SectionB', () => ({
  SectionB: () => <div data-testid="section-b">SectionB</div>,
}));
vi.mock('./SectionC', () => ({
  SectionC: () => <div data-testid="section-c">SectionC</div>,
}));
vi.mock('./SectionD', () => ({
  SectionD: () => <div data-testid="section-d">SectionD</div>,
}));
vi.mock('./SectionE', () => ({
  SectionE: () => <div data-testid="section-e">SectionE</div>,
}));
vi.mock('./SectionF', () => ({
  SectionF: () => <div data-testid="section-f">SectionF</div>,
}));

vi.mock('@/lib/api', () => ({
  submitStudy: (...args: unknown[]) => mockSubmitStudy(...args),
  updateSubmission: (...args: unknown[]) => mockUpdateSubmission(...args),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/hooks/useAutoSave', () => ({
  useAutoSave: () => ({
    hasDraft: mockHasDraft,
    loadDraft: mockLoadDraft,
    clearDraft: mockClearDraft,
    saveDraft: vi.fn(),
  }),
}));

function renderStudyForm(props: Parameters<typeof StudyForm>[0] = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <StudyForm {...props} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('StudyForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasDraft.mockReturnValue(false);
  });

  // --- Structure ---

  it('renders all visible form sections (A, B, D, E, F) when Section C is hidden', () => {
    renderStudyForm();
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Study Classification')).toBeInTheDocument();
    expect(screen.getByText('Timeline & Status')).toBeInTheDocument();
    expect(screen.getByText('Funding & Resources')).toBeInTheDocument();
    expect(screen.getByText('Outputs & Users')).toBeInTheDocument();
  });

  it('Section A is open by default', () => {
    renderStudyForm();
    expect(screen.getByTestId('section-a')).toBeInTheDocument();
  });

  it('shows FormProgress', () => {
    renderStudyForm();
    expect(screen.getByText('Form Completion')).toBeInTheDocument();
    expect(screen.getByText(/0 of 5 sections/)).toBeInTheDocument();
  });

  // --- Section C conditional visibility ---

  it('hides Section C when causalityMode is descriptive and methodClass is qualitative', () => {
    renderStudyForm({
      mode: 'edit',
      submissionId: 'test-id',
      initialData: {
        causalityMode: 'c0_descriptive',
        methodClass: 'qualitative',
      },
    });
    expect(screen.queryByText('Research Details')).not.toBeInTheDocument();
  });

  it('shows Section C when causalityMode is c2_causal', () => {
    renderStudyForm({
      mode: 'edit',
      submissionId: 'test-id',
      initialData: {
        causalityMode: 'c2_causal',
        methodClass: 'qualitative',
      },
    });
    expect(screen.getByText('Research Details')).toBeInTheDocument();
  });

  it('shows Section C when methodClass is quantitative', () => {
    renderStudyForm({
      mode: 'edit',
      submissionId: 'test-id',
      initialData: {
        causalityMode: 'c0_descriptive',
        methodClass: 'quantitative',
      },
    });
    expect(screen.getByText('Research Details')).toBeInTheDocument();
  });

  it('shows Section C when methodClass is experimental_quasi', () => {
    renderStudyForm({
      mode: 'edit',
      submissionId: 'test-id',
      initialData: {
        causalityMode: 'c0_descriptive',
        methodClass: 'experimental_quasi',
      },
    });
    expect(screen.getByText('Research Details')).toBeInTheDocument();
  });

  it('shows 6 total sections when Section C is visible', () => {
    renderStudyForm({
      mode: 'edit',
      submissionId: 'test-id',
      initialData: {
        causalityMode: 'c2_causal',
      },
    });
    expect(screen.getByText(/0 of 6 sections/)).toBeInTheDocument();
  });

  // --- Submit button ---

  it('shows "Submit Study" text in create mode', () => {
    renderStudyForm();
    expect(screen.getByText('Submit Study')).toBeInTheDocument();
  });

  it('shows "Update Study" text in edit mode', () => {
    renderStudyForm({ mode: 'edit', submissionId: 'test-id' });
    expect(screen.getByText('Update Study')).toBeInTheDocument();
  });

  it('shows "Complete all required sections" message when incomplete', () => {
    renderStudyForm();
    expect(screen.getByText(/Complete all required sections/)).toBeInTheDocument();
  });

  // --- Draft dialog ---

  it('shows draft recovery dialog when draft exists', async () => {
    mockHasDraft.mockReturnValue(true);
    renderStudyForm();

    await waitFor(() => {
      expect(screen.getByText(/Continue with saved draft/)).toBeInTheDocument();
    });
  });

  it('"Start Fresh" discards draft', async () => {
    const user = userEvent.setup();
    mockHasDraft.mockReturnValue(true);
    renderStudyForm();

    await waitFor(() => {
      expect(screen.getByText('Start Fresh')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Start Fresh'));
    expect(mockClearDraft).toHaveBeenCalled();
  });

  it('"Continue Draft" loads draft', async () => {
    const user = userEvent.setup();
    mockHasDraft.mockReturnValue(true);
    mockLoadDraft.mockReturnValue({ studyTitle: 'Saved Title' });
    renderStudyForm();

    await waitFor(() => {
      expect(screen.getByText('Continue Draft')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Continue Draft'));
    expect(mockLoadDraft).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Draft loaded' })
    );
  });

  it('shows edit-mode draft dialog text', async () => {
    mockHasDraft.mockReturnValue(true);
    renderStudyForm({ mode: 'edit', submissionId: 'test-id' });

    await waitFor(() => {
      expect(screen.getByText(/Continue with unsaved edits/)).toBeInTheDocument();
      expect(screen.getByText('Discard Edits')).toBeInTheDocument();
      expect(screen.getByText('Continue Editing')).toBeInTheDocument();
    });
  });
});
