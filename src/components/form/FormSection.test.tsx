import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormSection } from './FormSection';

describe('FormSection', () => {
  it('renders title and section label', () => {
    render(
      <FormSection title="Basic Information" sectionLabel="A" isOpen={false} onToggle={vi.fn()}>
        <p>content</p>
      </FormSection>
    );
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows children when isOpen is true', () => {
    render(
      <FormSection title="Test" isOpen={true} onToggle={vi.fn()}>
        <p>visible content</p>
      </FormSection>
    );
    expect(screen.getByText('visible content')).toBeInTheDocument();
  });

  it('hides children when isOpen is false', () => {
    render(
      <FormSection title="Test" isOpen={false} onToggle={vi.fn()}>
        <p>hidden content</p>
      </FormSection>
    );
    expect(screen.queryByText('hidden content')).not.toBeInTheDocument();
  });

  it('calls onToggle when header is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <FormSection title="Test Section" isOpen={false} onToggle={onToggle}>
        <p>content</p>
      </FormSection>
    );

    await user.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalled();
  });

  it('shows Complete indicator when isComplete is true', () => {
    render(
      <FormSection title="Test" isOpen={false} onToggle={vi.fn()} isComplete={true}>
        <p>content</p>
      </FormSection>
    );
    expect(screen.getByText(/Complete/)).toBeInTheDocument();
  });

  it('shows Conditional badge when isConditional is true', () => {
    render(
      <FormSection title="Test" isOpen={false} onToggle={vi.fn()} isConditional={true}>
        <p>content</p>
      </FormSection>
    );
    expect(screen.getByText('Conditional')).toBeInTheDocument();
  });
});
