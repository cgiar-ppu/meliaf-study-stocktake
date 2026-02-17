import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { MultiSelect, type OptionGroup } from './MultiSelect';

const groups: OptionGroup[] = [
  {
    label: 'Fruits',
    options: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
    ],
  },
  {
    label: 'Vegetables',
    options: [
      { value: 'carrot', label: 'Carrot' },
    ],
  },
];

describe('MultiSelect a11y', () => {
  it('has no violations when empty', async () => {
    const { container } = render(
      <MultiSelect groups={groups} value={[]} onChange={() => {}} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations with selected values', async () => {
    const { container } = render(
      <MultiSelect groups={groups} value={['apple', 'carrot']} onChange={() => {}} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations when popover is open', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MultiSelect groups={groups} value={[]} onChange={() => {}} />
    );
    await user.click(container.querySelector('[role="combobox"]')!);
    expect(await axe(container)).toHaveNoViolations();
  });
});
