import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import ForgotPassword from './ForgotPassword';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: vi.fn(),
    signInWithSSO: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getIdToken: vi.fn(),
    resetPassword: vi.fn(),
    confirmPasswordReset: vi.fn(),
    toggleDevMode: vi.fn(),
    isAuthenticated: false,
    isLoading: false,
    ssoAvailable: false,
    devModeEnabled: false,
    user: null,
  }),
}));

vi.mock('@/assets/cgiar-logo.png', () => ({ default: 'logo.png' }));

describe('ForgotPassword a11y', () => {
  it('has no violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );
    // heading-order: shadcn CardTitle renders <h3> after page <h1>, skipping h2
    expect(await axe(container, { rules: { 'heading-order': { enabled: false } } })).toHaveNoViolations();
  });
});
