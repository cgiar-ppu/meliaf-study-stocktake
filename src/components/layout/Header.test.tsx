import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Header } from './Header';

const { mockSignOut, authState } = vi.hoisted(() => ({
  mockSignOut: vi.fn(),
  authState: {
    devModeEnabled: false,
    userName: 'Test User',
    userEmail: 'test@cgiar.org',
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signOut: mockSignOut,
    toggleDevMode: vi.fn(),
    get devModeEnabled() { return authState.devModeEnabled; },
    user: {
      get name() { return authState.userName; },
      get email() { return authState.userEmail; },
    },
    isAuthenticated: true,
    isLoading: false,
    signIn: vi.fn(),
    signInWithSSO: vi.fn(),
    signUp: vi.fn(),
    getIdToken: vi.fn(),
    resetPassword: vi.fn(),
    confirmPasswordReset: vi.fn(),
    ssoAvailable: false,
  }),
}));

vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

vi.mock('@/assets/cgiar-logo.png', () => ({ default: 'logo.png' }));

function renderHeader(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Header />
    </MemoryRouter>
  );
}

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.devModeEnabled = false;
    authState.userName = 'Test User';
    authState.userEmail = 'test@cgiar.org';
  });

  it('renders navigation links', () => {
    renderHeader();
    expect(screen.getByText('My Submissions')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Submit Study')).toBeInTheDocument();
  });

  it('shows user name in dropdown area', () => {
    renderHeader();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('calls signOut when sign out is clicked', async () => {
    const user = userEvent.setup();
    renderHeader();

    // Open user dropdown
    const userButton = screen.getByText('Test User').closest('button')!;
    await user.click(userButton);

    await user.click(screen.getByText('Sign Out'));
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('shows DEV MODE badge when devModeEnabled is true', () => {
    authState.devModeEnabled = true;
    renderHeader();
    expect(screen.getByText('DEV MODE')).toBeInTheDocument();
  });

  it('hides DEV MODE badge when devModeEnabled is false', () => {
    authState.devModeEnabled = false;
    renderHeader();
    expect(screen.queryByText('DEV MODE')).not.toBeInTheDocument();
  });

  it('shows mobile menu when toggle is clicked', async () => {
    const user = userEvent.setup();
    renderHeader();

    // Mobile menu toggle button (the Menu icon button)
    const menuButtons = document.querySelectorAll('button.md\\:hidden');
    expect(menuButtons.length).toBeGreaterThan(0);

    await user.click(menuButtons[0] as HTMLElement);

    // Mobile nav should now be visible - check for duplicate nav links
    const submissions = screen.getAllByText('My Submissions');
    expect(submissions.length).toBeGreaterThanOrEqual(2);
  });
});
