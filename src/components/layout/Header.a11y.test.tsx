import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { Header } from './Header';

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
    isAuthenticated: true,
    isLoading: false,
    ssoAvailable: false,
    devModeEnabled: false,
    user: { name: 'Test User', email: 'test@cgiar.org' },
  }),
}));

vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

vi.mock('@/assets/cgiar-logo.png', () => ({ default: 'logo.png' }));

describe('Header a11y', () => {
  it('has no violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
