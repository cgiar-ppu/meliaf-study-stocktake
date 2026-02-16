import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilteredMultiSelect } from './FilteredMultiSelect';

describe('FilteredMultiSelect', () => {
  const options = [
    { value: 'us-ca', label: 'California' },
    { value: 'us-ny', label: 'New York' },
    { value: 'us-tx', label: 'Texas' },
    { value: 'us-fl', label: 'Florida' },
    { value: 'us-il', label: 'Illinois' },
    { value: 'us-pa', label: 'Pennsylvania' },
    { value: 'us-oh', label: 'Ohio' },
    { value: 'us-ga', label: 'Georgia' },
    { value: 'us-nc', label: 'North Carolina' },
    { value: 'us-mi', label: 'Michigan' },
  ];

  // Helper: the cmdk search input inside the popover (has placeholder attribute)
  function getSearchInput() {
    return screen.getByPlaceholderText('Type to search...');
  }

  it('renders placeholder when no values selected', () => {
    render(<FilteredMultiSelect options={options} value={[]} onChange={vi.fn()} placeholder="Select states..." />);
    expect(screen.getByText('Select states...')).toBeInTheDocument();
  });

  it('renders badges for selected values', () => {
    render(<FilteredMultiSelect options={options} value={['us-ca', 'us-ny']} onChange={vi.fn()} />);
    expect(screen.getByText('California')).toBeInTheDocument();
    expect(screen.getByText('New York')).toBeInTheDocument();
  });

  it('shows search prompt when search is empty', async () => {
    const user = userEvent.setup();
    render(<FilteredMultiSelect options={options} value={[]} onChange={vi.fn()} searchPlaceholder="Type to search..." />);

    await user.click(screen.getByRole('combobox'));

    // The search prompt text appears both as placeholder and in the dropdown body
    const prompts = screen.getAllByText('Type to search...');
    expect(prompts.length).toBeGreaterThanOrEqual(1);
  });

  it('filters options based on search query (case-insensitive)', async () => {
    const user = userEvent.setup();
    render(<FilteredMultiSelect options={options} value={[]} onChange={vi.fn()} />);

    await user.click(screen.getByRole('combobox'));
    await user.type(getSearchInput(), 'cal');

    expect(screen.getByText('California')).toBeInTheDocument();
    expect(screen.queryByText('Texas')).not.toBeInTheDocument();
  });

  it('shows "No results found" for non-matching search', async () => {
    const user = userEvent.setup();
    render(<FilteredMultiSelect options={options} value={[]} onChange={vi.fn()} />);

    await user.click(screen.getByRole('combobox'));
    await user.type(getSearchInput(), 'zzzzz');

    expect(screen.getByText('No results found.')).toBeInTheDocument();
  });

  it('limits displayed options to maxDisplayed', async () => {
    const user = userEvent.setup();
    render(<FilteredMultiSelect options={options} value={[]} onChange={vi.fn()} maxDisplayed={3} />);

    await user.click(screen.getByRole('combobox'));
    await user.type(getSearchInput(), 'a');

    expect(screen.getByText(/Showing 3 of/)).toBeInTheDocument();
  });

  it('calls onChange to add value on option click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FilteredMultiSelect options={options} value={[]} onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.type(getSearchInput(), 'Texas');
    await user.click(screen.getByText('Texas'));

    expect(onChange).toHaveBeenCalledWith(['us-tx']);
  });

  it('calls onChange to remove value on badge X click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FilteredMultiSelect options={options} value={['us-ca', 'us-ny']} onChange={onChange} />);

    // X buttons are the only <button> elements rendered (combobox trigger is a div)
    const removeButtons = screen.getAllByRole('button');
    await user.click(removeButtons[0]);

    expect(onChange).toHaveBeenCalledWith(['us-ny']);
  });
});
