import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StudyFormData, studyFormSchema, defaultFormValues } from '@/lib/formSchema';
import { SectionA } from './SectionA';

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

function renderSectionA(defaultValues?: Partial<StudyFormData>) {
  let formRef: ReturnType<typeof useForm<StudyFormData>> | undefined;

  const result = render(
    <TestWrapper defaultValues={defaultValues}>
      {(form) => {
        formRef = form;
        return <SectionA form={form} />;
      }}
    </TestWrapper>
  );

  return { ...result, getForm: () => formRef! };
}

describe('SectionA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 7 field labels', () => {
    renderSectionA();
    expect(screen.getByText('Study ID *')).toBeInTheDocument();
    expect(screen.getByText('Study Title *')).toBeInTheDocument();
    expect(screen.getByText('Lead Center / Entity *')).toBeInTheDocument();
    expect(screen.getByText('Window 3 / Bilateral')).toBeInTheDocument();
    expect(screen.getByText('Contact Name *')).toBeInTheDocument();
    expect(screen.getByText('Contact Email *')).toBeInTheDocument();
    expect(screen.getByText('Other Centers/Programs/Accelerators Involved *')).toBeInTheDocument();
  });

  it('updates form state when typing into studyTitle', async () => {
    const user = userEvent.setup();
    const { getForm } = renderSectionA();

    const input = screen.getByPlaceholderText('Enter the full title of the study');
    await user.type(input, 'My Test Study');

    expect(getForm().getValues('studyTitle')).toBe('My Test Study');
  });

  it('renders leadCenter Select with placeholder', () => {
    renderSectionA();
    expect(screen.getByText('Select lead center')).toBeInTheDocument();
  });

  it('renders w3Bilateral SearchableSelect with placeholder', () => {
    renderSectionA();
    expect(screen.getByText('Select a project...')).toBeInTheDocument();
  });

  it('renders otherCenters MultiSelect with placeholder', () => {
    renderSectionA();
    expect(screen.getByText('Select centers, programs, or accelerators...')).toBeInTheDocument();
  });

  it('accepts email input value', async () => {
    const user = userEvent.setup();
    const { getForm } = renderSectionA();

    const input = screen.getByPlaceholderText('email@cgiar.org');
    await user.type(input, 'test@cgiar.org');

    expect(getForm().getValues('contactEmail')).toBe('test@cgiar.org');
  });
});
