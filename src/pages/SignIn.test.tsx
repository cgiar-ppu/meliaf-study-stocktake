import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SignIn from './SignIn';

// --- Hoisted mocks ---
const {
  mockSignIn,
  mockSignInWithSSO,
  mockToggleDevMode,
  mockToast,
  authState,
} = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
  mockSignInWithSSO: vi.fn(),
  mockToggleDevMode: vi.fn(),
  mockToast: vi.fn(),
  authState: {
    isAuthenticated: false,
    isLoading: false,
    ssoAvailable: false,
    devModeEnabled: false,
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signInWithSSO: mockSignInWithSSO,
    toggleDevMode: mockToggleDevMode,
    get isAuthenticated() { return authState.isAuthenticated; },
    get isLoading() { return authState.isLoading; },
    get ssoAvailable() { return authState.ssoAvailable; },
    get devModeEnabled() { return authState.devModeEnabled; },
    user: null,
    signUp: vi.fn(),
    signOut: vi.fn(),
    getIdToken: vi.fn(),
    resetPassword: vi.fn(),
    confirmPasswordReset: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/assets/cgiar-logo.png', () => ({ default: 'logo.png' }));

function renderSignIn(initialEntries = ['/signin']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <SignIn />
    </MemoryRouter>
  );
}

describe('SignIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.isAuthenticated = false;
    authState.isLoading = false;
    authState.ssoAvailable = false;
    authState.devModeEnabled = false;
  });

  it('renders email and password inputs', () => {
    renderSignIn();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('shows error when submitting empty form', async () => {
    const user = userEvent.setup();
    renderSignIn();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Please enter both email and password.')).toBeInTheDocument();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('calls signIn with email and password on form submit', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue(undefined);
    renderSignIn();

    await user.type(screen.getByLabelText('Email'), 'user@cgiar.org');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(mockSignIn).toHaveBeenCalledWith('user@cgiar.org', 'secret123');
  });

  it('maps NotAuthorizedException to "Incorrect email or password"', async () => {
    const user = userEvent.setup();
    const error = new Error('Bad creds');
    error.name = 'NotAuthorizedException';
    mockSignIn.mockRejectedValue(error);
    renderSignIn();

    await user.type(screen.getByLabelText('Email'), 'user@cgiar.org');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText(/Incorrect email or password/)).toBeInTheDocument();
  });

  it('maps UserNotConfirmedException to confirm email message', async () => {
    const user = userEvent.setup();
    const error = new Error('Not confirmed');
    error.name = 'UserNotConfirmedException';
    mockSignIn.mockRejectedValue(error);
    renderSignIn();

    await user.type(screen.getByLabelText('Email'), 'user@cgiar.org');
    await user.type(screen.getByLabelText('Password'), 'pass');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText(/confirm your email/)).toBeInTheDocument();
  });

  it('shows SSO button when ssoAvailable is true', () => {
    authState.ssoAvailable = true;
    renderSignIn();
    expect(screen.getByText('Sign in with CGIAR SSO')).toBeInTheDocument();
  });

  it('hides SSO button when ssoAvailable is false', () => {
    authState.ssoAvailable = false;
    renderSignIn();
    expect(screen.queryByText('Sign in with CGIAR SSO')).not.toBeInTheDocument();
  });

  it('shows confirmed alert when ?confirmed=true in URL', async () => {
    renderSignIn(['/signin?confirmed=true']);
    await waitFor(() => {
      expect(screen.getByText(/Your email has been confirmed/)).toBeInTheDocument();
    });
  });

  it('shows error alert when ?error=confirmation_failed in URL', async () => {
    renderSignIn(['/signin?error=confirmation_failed']);
    await waitFor(() => {
      expect(screen.getByText(/Email confirmation failed/)).toBeInTheDocument();
    });
  });

  it('shows sign up link', () => {
    renderSignIn();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });
});
