import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { StudyFormData, studyFormSchema, defaultFormValues } from '@/lib/formSchema';
import { SectionD } from './SectionD';

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

function renderSectionD(defaultValues?: Partial<StudyFormData>) {
  let formRef: ReturnType<typeof useForm<StudyFormData>> | undefined;

  const result = render(
    <TestWrapper defaultValues={defaultValues}>
      {(form) => {
        formRef = form;
        return <SectionD form={form} />;
      }}
    </TestWrapper>
  );

  return { ...result, getForm: () => formRef! };
}

describe('SectionD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 4 field labels', () => {
    renderSectionD();
    expect(screen.getByText('Start Date *')).toBeInTheDocument();
    expect(screen.getByText('Expected End Date *')).toBeInTheDocument();
    expect(screen.getByText('Data Collection Status *')).toBeInTheDocument();
    expect(screen.getByText('Analysis Status *')).toBeInTheDocument();
  });

  it('shows "Pick a date" placeholder for date pickers', () => {
    renderSectionD();
    const placeholders = screen.getAllByText('Pick a date');
    expect(placeholders).toHaveLength(2);
  });

  it('displays formatted start date from defaultValues', () => {
    const date = new Date(2025, 5, 15); // June 15, 2025
    renderSectionD({ startDate: date });
    expect(screen.getByText(format(date, 'PPP'))).toBeInTheDocument();
  });

  it('displays formatted end date from defaultValues', () => {
    const date = new Date(2026, 11, 31); // Dec 31, 2026
    renderSectionD({ expectedEndDate: date });
    expect(screen.getByText(format(date, 'PPP'))).toBeInTheDocument();
  });

  it('renders dataCollectionStatus select with placeholder', () => {
    renderSectionD();
    const triggers = screen.getAllByText('Select status');
    expect(triggers.length).toBeGreaterThanOrEqual(1);
  });

  it('renders analysisStatus select with placeholder', () => {
    renderSectionD();
    const triggers = screen.getAllByText('Select status');
    expect(triggers).toHaveLength(2);
  });

  it('updates form state when status set via setValue', async () => {
    const { getForm } = renderSectionD();

    getForm().setValue('dataCollectionStatus', 'ongoing');

    await waitFor(() => {
      expect(getForm().getValues('dataCollectionStatus')).toBe('ongoing');
    });
  });
});
