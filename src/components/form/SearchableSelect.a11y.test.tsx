import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { SearchableSelect } from './SearchableSelect';

const options = [
  { value: 'opt1', label: 'Option One' },
  { value: 'opt2', label: 'Option Two' },
  { value: 'opt3', label: 'Option Three' },
];

describe('SearchableSelect a11y', () => {
  it('has no violations when closed', async () => {
    const { container } = render(
      <SearchableSelect options={options} value="" onChange={() => {}} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations when disabled', async () => {
    const { container } = render(
      <SearchableSelect options={options} value="" onChange={() => {}} disabled />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
