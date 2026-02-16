import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArchiveConfirmDialog } from './ArchiveConfirmDialog';

function renderDialog(props: Partial<React.ComponentProps<typeof ArchiveConfirmDialog>> = {}) {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    isLoading: false,
    ...props,
  };

  return { ...render(<ArchiveConfirmDialog {...defaultProps} />), props: defaultProps };
}

describe('ArchiveConfirmDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title when open', () => {
    renderDialog();
    expect(screen.getByText('Archive this submission?')).toBeInTheDocument();
  });

  it('has Archive button disabled when input is empty', () => {
    renderDialog();
    const archiveBtn = screen.getByRole('button', { name: 'Archive' });
    expect(archiveBtn).toBeDisabled();
  });

  it('enables Archive button when input equals "archive"', async () => {
    const user = userEvent.setup();
    renderDialog();

    const input = screen.getByPlaceholderText('Type "archive" to confirm');
    await user.type(input, 'archive');

    const archiveBtn = screen.getByRole('button', { name: 'Archive' });
    expect(archiveBtn).toBeEnabled();
  });

  it('keeps Archive button disabled during isLoading', async () => {
    const user = userEvent.setup();
    renderDialog({ isLoading: true });

    const input = screen.getByPlaceholderText('Type "archive" to confirm');
    await user.type(input, 'archive');

    const archiveBtn = screen.getByRole('button', { name: 'Archiving...' });
    expect(archiveBtn).toBeDisabled();
  });

  it('shows "Archiving..." text during loading', () => {
    renderDialog({ isLoading: true });
    expect(screen.getByText('Archiving...')).toBeInTheDocument();
  });

  it('calls onConfirm when Archive button clicked with valid input', async () => {
    const user = userEvent.setup();
    const { props } = renderDialog();

    const input = screen.getByPlaceholderText('Type "archive" to confirm');
    await user.type(input, 'archive');
    await user.click(screen.getByRole('button', { name: 'Archive' }));

    expect(props.onConfirm).toHaveBeenCalledOnce();
  });
});
