import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { CreatableMultiSelect } from './CreatableMultiSelect';

const suggestions = [
  { value: 'wheat', label: 'Wheat' },
  { value: 'rice', label: 'Rice' },
  { value: 'maize', label: 'Maize' },
];

describe('CreatableMultiSelect a11y', () => {
  it('has no violations when empty', async () => {
    const { container } = render(
      <CreatableMultiSelect suggestions={suggestions} value={[]} onChange={() => {}} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations with selected values', async () => {
    const { container } = render(
      <CreatableMultiSelect suggestions={suggestions} value={['wheat', 'custom-crop']} onChange={() => {}} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
