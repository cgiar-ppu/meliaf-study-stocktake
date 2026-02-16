import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StudyFormData, studyFormSchema, defaultFormValues } from '@/lib/formSchema';
import { SectionF } from './SectionF';
import { PRIMARY_USER_OPTIONS } from '@/types';

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

function renderSectionF(defaultValues?: Partial<StudyFormData>) {
  let formRef: ReturnType<typeof useForm<StudyFormData>> | undefined;

  const result = render(
    <TestWrapper defaultValues={defaultValues}>
      {(form) => {
        formRef = form;
        return <SectionF form={form} />;
      }}
    </TestWrapper>
  );

  return { ...result, getForm: () => formRef! };
}

describe('SectionF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 3 YesNoLinkField labels', () => {
    renderSectionF();
    expect(screen.getByText('Manuscript/Report Developed? *')).toBeInTheDocument();
    expect(screen.getByText('Policy Brief/Comms Product Developed? *')).toBeInTheDocument();
    expect(screen.getByText('Related to Past MELIAF Study? *')).toBeInTheDocument();
  });

  it('renders all PRIMARY_USER_OPTIONS checkbox labels', () => {
    renderSectionF();
    for (const option of PRIMARY_USER_OPTIONS) {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    }
  });

  it('adds value to intendedPrimaryUser when checkbox is checked', async () => {
    const user = userEvent.setup();
    const { getForm } = renderSectionF();

    const checkbox = screen.getByText('Donor').closest('div')!.querySelector('button')!;
    await user.click(checkbox);

    await waitFor(() => {
      expect(getForm().getValues('intendedPrimaryUser')).toContain('donor');
    });
  });

  it('removes value from intendedPrimaryUser when checkbox is unchecked', async () => {
    const user = userEvent.setup();
    const { getForm } = renderSectionF({
      intendedPrimaryUser: ['donor', 'board'],
    } as Partial<StudyFormData>);

    const checkbox = screen.getByText('Donor').closest('div')!.querySelector('button')!;
    await user.click(checkbox);

    await waitFor(() => {
      expect(getForm().getValues('intendedPrimaryUser')).not.toContain('donor');
      expect(getForm().getValues('intendedPrimaryUser')).toContain('board');
    });
  });

  it('renders "Select all that apply" description', () => {
    renderSectionF();
    expect(screen.getByText('Select all that apply')).toBeInTheDocument();
  });

  it('renders commissioningSource label', () => {
    renderSectionF();
    expect(screen.getByText('Commissioning Source *')).toBeInTheDocument();
  });

  it('accepts text in commissioningSource input', async () => {
    const user = userEvent.setup();
    const { getForm } = renderSectionF();

    const input = screen.getByPlaceholderText(
      'Who commissioned this study? (Funder, Board, System Council, etc)'
    );
    await user.type(input, 'World Bank');

    expect(getForm().getValues('commissioningSource')).toBe('World Bank');
  });
});
