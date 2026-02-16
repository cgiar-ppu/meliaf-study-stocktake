import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StudyFormData, studyFormSchema, defaultFormValues } from '@/lib/formSchema';
import { SectionB } from './SectionB';

// Mock FileUpload to avoid S3/query client dependencies
vi.mock('./FileUpload', () => ({
  FileUpload: vi.fn(() => <div data-testid="file-upload-stub" />),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

// Wrapper that provides react-hook-form context
function TestWrapper({
  defaultValues,
  children,
}: {
  defaultValues?: Partial<StudyFormData>;
  children: (form: ReturnType<typeof useForm<StudyFormData>>) => React.ReactNode;
}) {
  const form = useForm<StudyFormData>({
    resolver: zodResolver(studyFormSchema),
    defaultValues: { ...defaultFormValues, ...defaultValues },
    mode: 'onChange',
  });

  return <FormProvider {...form}>{children(form)}</FormProvider>;
}

function renderSectionB(defaultValues?: Partial<StudyFormData>) {
  let formRef: ReturnType<typeof useForm<StudyFormData>> | undefined;

  const result = render(
    <TestWrapper defaultValues={defaultValues}>
      {(form) => {
        formRef = form;
        return <SectionB form={form} />;
      }}
    </TestWrapper>
  );

  return { ...result, getForm: () => formRef! };
}

describe('SectionB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Field visibility ---

  it('renders all classification select fields', () => {
    renderSectionB();
    expect(screen.getByText('Study Type *')).toBeInTheDocument();
    expect(screen.getByText('Timing *')).toBeInTheDocument();
    expect(screen.getByText('Analytical Scope *')).toBeInTheDocument();
    expect(screen.getByText('Geographic Scope *')).toBeInTheDocument();
    expect(screen.getByText('Result Level *')).toBeInTheDocument();
    expect(screen.getByText('Causality Mode *')).toBeInTheDocument();
    expect(screen.getByText('Method Class *')).toBeInTheDocument();
  });

  it('hides all geographic fields when scope is global', () => {
    renderSectionB({ geographicScope: 'global' });
    expect(screen.queryByText('Region(s)')).not.toBeInTheDocument();
    expect(screen.queryByText('Country(ies)')).not.toBeInTheDocument();
    expect(screen.queryByText('Province(s)/State(s)')).not.toBeInTheDocument();
  });

  it('hides all geographic fields when scope is site_specific', () => {
    renderSectionB({ geographicScope: 'site_specific' });
    expect(screen.queryByText('Region(s)')).not.toBeInTheDocument();
    expect(screen.queryByText('Country(ies)')).not.toBeInTheDocument();
    expect(screen.queryByText('Province(s)/State(s)')).not.toBeInTheDocument();
  });

  it('shows editable Region multi-select when scope is regional', () => {
    renderSectionB({ geographicScope: 'regional' });
    expect(screen.getByText('Region(s)')).toBeInTheDocument();
    expect(screen.queryByText('Country(ies)')).not.toBeInTheDocument();
    expect(screen.queryByText('Province(s)/State(s)')).not.toBeInTheDocument();
  });

  it('shows editable Country multi-select when scope is national', () => {
    renderSectionB({ geographicScope: 'national' });
    expect(screen.getByText('Country(ies)')).toBeInTheDocument();
    expect(screen.queryByText('Province(s)/State(s)')).not.toBeInTheDocument();
  });

  it('shows editable Province multi-select when scope is sub_national', () => {
    renderSectionB({ geographicScope: 'sub_national' });
    expect(screen.getByText('Province(s)/State(s)')).toBeInTheDocument();
  });

  // --- Auto-population cascading ---

  it('auto-populates regions when countries are selected (national scope)', async () => {
    const { getForm } = renderSectionB({ geographicScope: 'national' });

    // Set countries (Kenya is in Eastern and Southern Africa)
    getForm().setValue('studyCountries', ['KE'], { shouldDirty: true });

    await waitFor(() => {
      const regions = getForm().getValues('studyRegions');
      expect(regions).toContain('ESA');
    });
  });

  it('auto-populates countries and regions from provinces (sub_national scope)', async () => {
    const { getForm } = renderSectionB({ geographicScope: 'sub_national' });

    // Set a Kenyan province (KE-01 = Baringo)
    getForm().setValue('studySubnational', ['KE-01'], { shouldDirty: true });

    await waitFor(() => {
      const countries = getForm().getValues('studyCountries');
      expect(countries).toContain('KE');
    });

    await waitFor(() => {
      const regions = getForm().getValues('studyRegions');
      expect(regions).toContain('ESA');
    });
  });

  // --- Clearing on scope change ---

  it('clears countries and subnational when switching to regional', async () => {
    const { getForm } = renderSectionB({
      geographicScope: 'national',
      studyCountries: ['KE'],
      studySubnational: ['KE-01'],
    });

    getForm().setValue('geographicScope', 'regional');

    await waitFor(() => {
      expect(getForm().getValues('studyCountries')).toEqual([]);
      expect(getForm().getValues('studySubnational')).toEqual([]);
    });
  });

  it('clears regions and subnational when switching to national', async () => {
    const { getForm } = renderSectionB({
      geographicScope: 'regional',
      studyRegions: ['ESA'],
    });

    getForm().setValue('geographicScope', 'national');

    await waitFor(() => {
      expect(getForm().getValues('studyRegions')).toEqual([]);
      expect(getForm().getValues('studySubnational')).toEqual([]);
    });
  });

  it('clears all geographic fields when switching to global', async () => {
    const { getForm } = renderSectionB({
      geographicScope: 'national',
      studyCountries: ['KE'],
      studyRegions: ['ESA'],
    });

    getForm().setValue('geographicScope', 'global');

    await waitFor(() => {
      expect(getForm().getValues('studyRegions')).toEqual([]);
      expect(getForm().getValues('studyCountries')).toEqual([]);
      expect(getForm().getValues('studySubnational')).toEqual([]);
    });
  });

  it('clears all geographic fields when switching to sub_national', async () => {
    const { getForm } = renderSectionB({
      geographicScope: 'national',
      studyCountries: ['KE'],
      studyRegions: ['ESA'],
    });

    getForm().setValue('geographicScope', 'sub_national');

    await waitFor(() => {
      expect(getForm().getValues('studyRegions')).toEqual([]);
      expect(getForm().getValues('studyCountries')).toEqual([]);
      expect(getForm().getValues('studySubnational')).toEqual([]);
    });
  });

  it('renders file upload stub', () => {
    renderSectionB();
    expect(screen.getByTestId('file-upload-stub')).toBeInTheDocument();
  });
});
