import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { FilteredMultiSelect } from './FilteredMultiSelect';

const options = [
  { value: 'us-ca', label: 'California, US' },
  { value: 'us-ny', label: 'New York, US' },
  { value: 'gb-eng', label: 'England, GB' },
];

describe('FilteredMultiSelect a11y', () => {
  it('has no violations when empty', async () => {
    const { container } = render(
      <FilteredMultiSelect options={options} value={[]} onChange={() => {}} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations with selected values', async () => {
    const { container } = render(
      <FilteredMultiSelect options={options} value={['us-ca', 'gb-eng']} onChange={() => {}} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
