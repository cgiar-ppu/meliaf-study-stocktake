import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StudyFormData, studyFormSchema, defaultFormValues } from '@/lib/formSchema';
import { SectionE } from './SectionE';

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

function renderSectionE(defaultValues?: Partial<StudyFormData>) {
  let formRef: ReturnType<typeof useForm<StudyFormData>> | undefined;

  const result = render(
    <TestWrapper defaultValues={defaultValues}>
      {(form) => {
        formRef = form;
        return <SectionE form={form} />;
      }}
    </TestWrapper>
  );

  return { ...result, getForm: () => formRef! };
}

describe('SectionE', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Funded? *" label', () => {
    renderSectionE();
    expect(screen.getByText('Funded? *')).toBeInTheDocument();
  });

  it('hides fundingSource when funded is empty', () => {
    renderSectionE();
    expect(screen.queryByText('Funding Source *')).not.toBeInTheDocument();
  });

  it('shows fundingSource when funded is "yes"', () => {
    renderSectionE({ funded: 'yes' } as Partial<StudyFormData>);
    expect(screen.getByText('Funding Source *')).toBeInTheDocument();
  });

  it('shows fundingSource when funded is "partial"', () => {
    renderSectionE({ funded: 'partial' } as Partial<StudyFormData>);
    expect(screen.getByText('Funding Source *')).toBeInTheDocument();
  });

  it('displays comma-formatted totalCostUSD', () => {
    renderSectionE({ totalCostUSD: 50000 } as Partial<StudyFormData>);
    const input = screen.getByPlaceholderText('Enter amount');
    expect(input).toHaveValue('50,000');
  });

  it('renders proposalAvailable YesNoLinkField label', () => {
    renderSectionE();
    expect(screen.getByText('Proposal/Concept Note Available? *')).toBeInTheDocument();
  });

  it('renders totalCostUSD label', () => {
    renderSectionE();
    expect(screen.getByText('Total Cost (USD) *')).toBeInTheDocument();
  });
});
