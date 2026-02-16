import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchableSelect } from './SearchableSelect';

describe('SearchableSelect', () => {
  const flatOptions = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
    { value: 'c', label: 'Charlie' },
  ];

  const groups = [
    { label: 'Group 1', options: [{ value: 'x', label: 'X-Ray' }] },
    { label: 'Group 2', options: [{ value: 'y', label: 'Yankee' }] },
  ];

  it('renders placeholder when no value selected', () => {
    render(<SearchableSelect options={flatOptions} value="" onChange={vi.fn()} placeholder="Pick one..." />);
    expect(screen.getByText('Pick one...')).toBeInTheDocument();
  });

  it('renders selected option label', () => {
    render(<SearchableSelect options={flatOptions} value="b" onChange={vi.fn()} />);
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('shows flat options in dropdown', async () => {
    const user = userEvent.setup();
    render(<SearchableSelect options={flatOptions} value="" onChange={vi.fn()} />);

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('shows grouped options with headings', async () => {
    const user = userEvent.setup();
    render(<SearchableSelect groups={groups} value="" onChange={vi.fn()} />);

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByText('Group 1')).toBeInTheDocument();
    expect(screen.getByText('Group 2')).toBeInTheDocument();
    expect(screen.getByText('X-Ray')).toBeInTheDocument();
    expect(screen.getByText('Yankee')).toBeInTheDocument();
  });

  it('calls onChange on option select', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchableSelect options={flatOptions} value="" onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Alpha'));

    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('renders disabled state with disabledPlaceholder', () => {
    render(
      <SearchableSelect
        options={flatOptions}
        value=""
        onChange={vi.fn()}
        disabled={true}
        disabledPlaceholder="Not available"
      />
    );
    expect(screen.getByText('Not available')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
