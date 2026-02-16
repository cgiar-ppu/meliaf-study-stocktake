import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiSelect } from './MultiSelect';

describe('MultiSelect', () => {
  const groups = [
    {
      label: 'Fruits',
      options: [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
      ],
    },
    {
      label: 'Veggies',
      options: [
        { value: 'carrot', label: 'Carrot' },
      ],
    },
  ];

  it('renders placeholder when no values selected', () => {
    render(<MultiSelect groups={groups} value={[]} onChange={vi.fn()} placeholder="Pick items..." />);
    expect(screen.getByText('Pick items...')).toBeInTheDocument();
  });

  it('renders badges for selected values with labels', () => {
    render(<MultiSelect groups={groups} value={['apple', 'carrot']} onChange={vi.fn()} />);
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Carrot')).toBeInTheDocument();
  });

  it('shows group headings in dropdown', async () => {
    const user = userEvent.setup();
    render(<MultiSelect groups={groups} value={[]} onChange={vi.fn()} />);

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByText('Fruits')).toBeInTheDocument();
    expect(screen.getByText('Veggies')).toBeInTheDocument();
  });

  it('calls onChange to add value when option clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect groups={groups} value={[]} onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Banana'));

    expect(onChange).toHaveBeenCalledWith(['banana']);
  });

  it('calls onChange to remove value when selected option re-clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect groups={groups} value={['apple']} onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    // "Apple" appears both in badge and dropdown; target the option role
    await user.click(screen.getByRole('option', { name: /Apple/ }));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('removes value when badge X button clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect groups={groups} value={['apple', 'carrot']} onChange={onChange} />);

    // X buttons are the only <button> elements rendered (combobox trigger is a div)
    const removeButtons = screen.getAllByRole('button');
    await user.click(removeButtons[0]);

    expect(onChange).toHaveBeenCalledWith(['carrot']);
  });

  it('displays fallback value for unknown option values', () => {
    render(<MultiSelect groups={groups} value={['unknown_val']} onChange={vi.fn()} />);
    expect(screen.getByText('unknown_val')).toBeInTheDocument();
  });
});
