import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagInput } from './TagInput';

describe('TagInput', () => {
  it('renders placeholder when value is empty', () => {
    render(<TagInput value={[]} onChange={vi.fn()} placeholder="Add tags..." />);
    expect(screen.getByPlaceholderText('Add tags...')).toBeInTheDocument();
  });

  it('renders badges for each tag', () => {
    render(<TagInput value={['alpha', 'beta']} onChange={vi.fn()} />);
    expect(screen.getByText('alpha')).toBeInTheDocument();
    expect(screen.getByText('beta')).toBeInTheDocument();
  });

  it('hides placeholder when tags exist', () => {
    render(<TagInput value={['alpha']} onChange={vi.fn()} placeholder="Add tags..." />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('placeholder', 'Add tags...');
  });

  it('calls onChange with new tag on Enter key', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'new-tag{Enter}');

    expect(onChange).toHaveBeenCalledWith(['new-tag']);
  });

  it('trims whitespace from input before adding', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, '  spaced  {Enter}');

    expect(onChange).toHaveBeenCalledWith(['spaced']);
  });

  it('prevents duplicate tags', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput value={['existing']} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'existing{Enter}');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('removes tag when X button clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput value={['alpha', 'beta']} onChange={onChange} />);

    const removeButtons = screen.getAllByRole('button');
    await user.click(removeButtons[0]);

    expect(onChange).toHaveBeenCalledWith(['beta']);
  });

  it('removes last tag on Backspace when input is empty', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput value={['alpha', 'beta']} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.keyboard('{Backspace}');

    expect(onChange).toHaveBeenCalledWith(['alpha']);
  });

  it('adds tag on blur', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput value={[]} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'blur-tag');
    await user.tab(); // triggers blur

    expect(onChange).toHaveBeenCalledWith(['blur-tag']);
  });
});
