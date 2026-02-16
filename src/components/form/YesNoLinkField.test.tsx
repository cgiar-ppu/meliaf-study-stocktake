import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YesNoLinkField } from './YesNoLinkField';

describe('YesNoLinkField', () => {
  it('renders Yes and No radio buttons', () => {
    render(<YesNoLinkField onChange={vi.fn()} />);
    expect(screen.getByLabelText('Yes')).toBeInTheDocument();
    expect(screen.getByLabelText('No')).toBeInTheDocument();
  });

  it('calls onChange with answer=yes and empty link on Yes click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<YesNoLinkField value={{ answer: undefined }} onChange={onChange} />);

    await user.click(screen.getByLabelText('Yes'));
    expect(onChange).toHaveBeenCalledWith({ answer: 'yes', link: '' });
  });

  it('calls onChange with answer=no and cleared link on No click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<YesNoLinkField value={{ answer: 'yes', link: 'https://example.com' }} onChange={onChange} />);

    await user.click(screen.getByLabelText('No'));
    expect(onChange).toHaveBeenCalledWith({ answer: 'no', link: '' });
  });

  it('shows link input only when answer is yes', () => {
    const { rerender } = render(
      <YesNoLinkField value={{ answer: 'yes' }} onChange={vi.fn()} linkPlaceholder="Enter URL" />
    );
    expect(screen.getByPlaceholderText('Enter URL')).toBeInTheDocument();

    rerender(
      <YesNoLinkField value={{ answer: 'no' }} onChange={vi.fn()} linkPlaceholder="Enter URL" />
    );
    expect(screen.queryByPlaceholderText('Enter URL')).not.toBeInTheDocument();
  });

  it('hides link input when answer is no', () => {
    render(<YesNoLinkField value={{ answer: 'no' }} onChange={vi.fn()} />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('calls onChange with link value on input change', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<YesNoLinkField value={{ answer: 'yes', link: '' }} onChange={onChange} />);

    const input = screen.getByPlaceholderText('Enter link');
    await user.type(input, 'h');

    expect(onChange).toHaveBeenCalledWith({ answer: 'yes', link: 'h' });
  });

  it('auto-prepends https:// on blur when no protocol present', () => {
    const onChange = vi.fn();
    render(<YesNoLinkField value={{ answer: 'yes', link: 'example.com' }} onChange={onChange} />);

    const input = screen.getByPlaceholderText('Enter link');
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith({ answer: 'yes', link: 'https://example.com' });
  });

  it('does not prepend https:// if already present', () => {
    const onChange = vi.fn();
    render(<YesNoLinkField value={{ answer: 'yes', link: 'https://example.com' }} onChange={onChange} />);

    const input = screen.getByPlaceholderText('Enter link');
    fireEvent.blur(input);

    // onChange should NOT be called because protocol is already present
    expect(onChange).not.toHaveBeenCalled();
  });

  it('displays linkError message when provided', () => {
    render(
      <YesNoLinkField
        value={{ answer: 'yes', link: '' }}
        onChange={vi.fn()}
        linkError="Please enter a valid URL"
      />
    );
    expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
  });
});
