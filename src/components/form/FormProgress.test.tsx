import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormProgress } from './FormProgress';

describe('FormProgress', () => {
  it('renders completion text', () => {
    render(<FormProgress completedSections={2} totalSections={5} />);
    expect(screen.getByText('2 of 5 sections')).toBeInTheDocument();
  });

  it('renders 0 of N when no sections complete', () => {
    render(<FormProgress completedSections={0} totalSections={5} />);
    expect(screen.getByText('0 of 5 sections')).toBeInTheDocument();
  });

  it('renders N of N when all sections complete', () => {
    render(<FormProgress completedSections={5} totalSections={5} />);
    expect(screen.getByText('5 of 5 sections')).toBeInTheDocument();
  });

  it('renders progress bar element', () => {
    render(<FormProgress completedSections={3} totalSections={6} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
