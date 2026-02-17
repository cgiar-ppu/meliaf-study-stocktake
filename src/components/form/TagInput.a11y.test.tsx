import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { TagInput } from './TagInput';

describe('TagInput a11y', () => {
  it('has no violations when empty', async () => {
    const { container } = render(
      <TagInput value={[]} onChange={() => {}} placeholder="Add a keyword" />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations with tags', async () => {
    const { container } = render(
      <TagInput value={['climate', 'agriculture', 'resilience']} onChange={() => {}} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
