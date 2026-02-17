import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { YesNoLinkField } from './YesNoLinkField';

describe('YesNoLinkField a11y', () => {
  it('has no violations in default state', async () => {
    const { container } = render(
      <YesNoLinkField onChange={() => {}} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations when "yes" is selected (shows URL input)', async () => {
    const { container } = render(
      <YesNoLinkField
        value={{ answer: 'yes', link: '' }}
        onChange={() => {}}
        linkPlaceholder="Enter DOI or URL"
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations when "no" is selected', async () => {
    const { container } = render(
      <YesNoLinkField
        value={{ answer: 'no', link: '' }}
        onChange={() => {}}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
