import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StudyFormData, studyFormSchema, defaultFormValues } from '@/lib/formSchema';
import { SectionC } from './SectionC';

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

function renderSectionC(defaultValues?: Partial<StudyFormData>) {
  let formRef: ReturnType<typeof useForm<StudyFormData>> | undefined;

  const result = render(
    <TestWrapper defaultValues={defaultValues}>
      {(form) => {
        formRef = form;
        return <SectionC form={form} />;
      }}
    </TestWrapper>
  );

  return { ...result, getForm: () => formRef! };
}

describe('SectionC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 8 field labels', () => {
    renderSectionC();
    expect(screen.getByText('Key Research Question(s)')).toBeInTheDocument();
    expect(screen.getByText('Unit of Analysis')).toBeInTheDocument();
    expect(screen.getByText('Treatment/Intervention')).toBeInTheDocument();
    expect(screen.getByText('Sample Size')).toBeInTheDocument();
    expect(screen.getByText('Power Calculation Conducted?')).toBeInTheDocument();
    expect(screen.getByText('Data Collection Method(s)')).toBeInTheDocument();
    expect(screen.getByText('Pre-Analysis Plan Available?')).toBeInTheDocument();
    expect(screen.getByText('Number of Data Collection Rounds')).toBeInTheDocument();
  });

  it('displays comma-formatted sampleSize value', () => {
    renderSectionC({ sampleSize: 1000 } as Partial<StudyFormData>);
    const input = screen.getByPlaceholderText('Enter sample size');
    expect(input).toHaveValue('1,000');
  });

  it('parses sampleSize correctly by stripping commas', async () => {
    const user = userEvent.setup();
    const { getForm } = renderSectionC();

    const input = screen.getByPlaceholderText('Enter sample size');
    await user.type(input, '5000');

    expect(getForm().getValues('sampleSize')).toBe(5000);
  });

  it('accepts text in keyResearchQuestions textarea', async () => {
    const user = userEvent.setup();
    const { getForm } = renderSectionC();

    const textarea = screen.getByPlaceholderText(
      'Enter the main research questions this study aims to answer...'
    );
    await user.type(textarea, 'What is the impact?');

    expect(getForm().getValues('keyResearchQuestions')).toBe('What is the impact?');
  });

  it('renders unitOfAnalysis CreatableMultiSelect with placeholder', () => {
    renderSectionC();
    expect(screen.getByText('Select or type unit of analysis...')).toBeInTheDocument();
  });

  it('renders dataCollectionMethods CreatableMultiSelect', () => {
    renderSectionC();
    expect(
      screen.getByText('Select or type data collection methods...')
    ).toBeInTheDocument();
  });

  it('renders powerCalculation Select with placeholder', () => {
    renderSectionC();
    expect(screen.getByText('Select option')).toBeInTheDocument();
  });

  it('accepts numeric input for dataCollectionRounds', async () => {
    const user = userEvent.setup();
    const { getForm } = renderSectionC();

    const input = screen.getByPlaceholderText('e.g., 1, 2, 3');
    await user.type(input, '3');

    expect(getForm().getValues('dataCollectionRounds')).toBe(3);
  });
});
