import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreatableMultiSelect } from './CreatableMultiSelect';

describe('CreatableMultiSelect', () => {
  const suggestions = [
    { value: 'surveys', label: 'Surveys' },
    { value: 'interviews', label: 'Interviews' },
    { value: 'focus_groups', label: 'Focus Groups' },
  ];

  it('renders placeholder when no values selected', () => {
    render(<CreatableMultiSelect suggestions={suggestions} value={[]} onChange={vi.fn()} placeholder="Select methods..." />);
    expect(screen.getByText('Select methods...')).toBeInTheDocument();
  });

  it('renders badges for selected values using suggestion labels', () => {
    render(<CreatableMultiSelect suggestions={suggestions} value={['surveys', 'interviews']} onChange={vi.fn()} />);
    expect(screen.getByText('Surveys')).toBeInTheDocument();
    expect(screen.getByText('Interviews')).toBeInTheDocument();
  });

  it('renders badges for custom values showing raw value', () => {
    render(<CreatableMultiSelect suggestions={suggestions} value={['custom-method']} onChange={vi.fn()} />);
    expect(screen.getByText('custom-method')).toBeInTheDocument();
  });

  it('calls onChange with suggestion value when suggestion clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CreatableMultiSelect suggestions={suggestions} value={[]} onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Focus Groups'));

    expect(onChange).toHaveBeenCalledWith(['focus_groups']);
  });

  it('adds custom value on Enter when no suggestion match', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CreatableMultiSelect suggestions={suggestions} value={[]} onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    const searchInput = screen.getByPlaceholderText('Search or type custom value...');
    await user.type(searchInput, 'My Custom Method{Enter}');

    expect(onChange).toHaveBeenCalledWith(['My Custom Method']);
  });

  it('matches suggestions case-insensitively on Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CreatableMultiSelect suggestions={suggestions} value={[]} onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    const searchInput = screen.getByPlaceholderText('Search or type custom value...');
    await user.type(searchInput, 'surveys{Enter}');

    // Should match the existing suggestion and use its value
    expect(onChange).toHaveBeenCalledWith(['surveys']);
  });

  it('prevents duplicate values', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CreatableMultiSelect suggestions={suggestions} value={['surveys']} onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    const searchInput = screen.getByPlaceholderText('Search or type custom value...');
    await user.type(searchInput, 'Surveys{Enter}');

    // Should not call onChange since 'surveys' is already in value
    expect(onChange).not.toHaveBeenCalled();
  });

  it('removes value when badge X button clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CreatableMultiSelect suggestions={suggestions} value={['surveys', 'interviews']} onChange={onChange} />);

    // X buttons are the only <button> elements rendered (combobox trigger is a div)
    const removeButtons = screen.getAllByRole('button');
    await user.click(removeButtons[0]);

    expect(onChange).toHaveBeenCalledWith(['interviews']);
  });
});
