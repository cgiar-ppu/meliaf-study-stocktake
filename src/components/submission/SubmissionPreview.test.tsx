import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { SubmissionItem } from '@/lib/api';
import { SubmissionPreview } from './SubmissionPreview';

vi.mock('@/lib/api', () => ({
  listFiles: vi.fn().mockResolvedValue({ files: [] }),
}));

function createSubmission(overrides: Partial<SubmissionItem> = {}): SubmissionItem {
  return {
    submissionId: 'sub-1',
    version: 1,
    userId: 'user-1',
    status: 'active',
    createdAt: '2025-01-15T10:00:00Z',
    studyId: 'STD-001',
    studyTitle: 'Test Study Title',
    leadCenter: 'IFPRI',
    contactName: 'John Doe',
    contactEmail: 'john@cgiar.org',
    otherCenters: ['CIAT', 'ICRISAT'],
    studyType: 'impact_evaluation',
    timing: 'ex_post',
    analyticalScope: 'national',
    geographicScope: 'national',
    resultLevel: 'output',
    causalityMode: 'c0_descriptive',
    methodClass: 'qualitative',
    ...overrides,
  } as SubmissionItem;
}

function renderPreview(submission: SubmissionItem) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SubmissionPreview submission={submission} />
    </QueryClientProvider>
  );
}

describe('SubmissionPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders section headers', () => {
    renderPreview(createSubmission());
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Study Classification')).toBeInTheDocument();
    expect(screen.getByText('Timeline & Status')).toBeInTheDocument();
    expect(screen.getByText('Funding & Resources')).toBeInTheDocument();
    expect(screen.getByText('Outputs & Users')).toBeInTheDocument();
  });

  it('shows field values from submission', () => {
    renderPreview(createSubmission());
    expect(screen.getByText('Test Study Title')).toBeInTheDocument();
    expect(screen.getByText('IFPRI')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('hides Section C when descriptive + qualitative', () => {
    renderPreview(
      createSubmission({ causalityMode: 'c0_descriptive', methodClass: 'qualitative' })
    );
    expect(screen.queryByText('Research Details')).not.toBeInTheDocument();
  });

  it('shows Section C when causalityMode is c2_causal', () => {
    renderPreview(createSubmission({ causalityMode: 'c2_causal' }));
    expect(screen.getByText('Research Details')).toBeInTheDocument();
  });

  it('shows Section C when methodClass is quantitative', () => {
    renderPreview(createSubmission({ methodClass: 'quantitative' }));
    expect(screen.getByText('Research Details')).toBeInTheDocument();
  });

  it('renders array fields as badges', () => {
    renderPreview(createSubmission({ otherCenters: ['CIAT', 'ICRISAT'] }));
    expect(screen.getByText('CIAT')).toBeInTheDocument();
    expect(screen.getByText('ICRISAT')).toBeInTheDocument();
  });

  it('shows "—" for empty fields', () => {
    renderPreview(createSubmission({ fundingSource: undefined }));
    // Multiple dash characters for empty fields
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('renders STD-001 study ID', () => {
    renderPreview(createSubmission());
    expect(screen.getByText('STD-001')).toBeInTheDocument();
  });
});
