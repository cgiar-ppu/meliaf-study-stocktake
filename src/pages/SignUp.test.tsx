import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SignUp from './SignUp';

const { mockSignUp, authState } = vi.hoisted(() => ({
  mockSignUp: vi.fn(),
  authState: { isLoading: false },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signUp: mockSignUp,
    get isLoading() { return authState.isLoading; },
    isAuthenticated: false,
    user: null,
    signIn: vi.fn(),
    signInWithSSO: vi.fn(),
    signOut: vi.fn(),
    getIdToken: vi.fn(),
    resetPassword: vi.fn(),
    confirmPasswordReset: vi.fn(),
    ssoAvailable: false,
    devModeEnabled: false,
    toggleDevMode: vi.fn(),
  }),
}));

vi.mock('@/assets/cgiar-logo.png', () => ({ default: 'logo.png' }));

function renderSignUp() {
  return render(
    <MemoryRouter initialEntries={['/signup']}>
      <SignUp />
    </MemoryRouter>
  );
}

describe('SignUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.isLoading = false;
  });

  it('renders name, email, password, and confirmPassword inputs', () => {
    renderSignUp();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  it('shows domain restriction info', () => {
    renderSignUp();
    expect(screen.getByText(/cgiar.org, synapsis-analytics.com/)).toBeInTheDocument();
  });

  it('shows error on empty submit', async () => {
    const user = userEvent.setup();
    renderSignUp();

    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Please fill in all fields.')).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('rejects non-allowed email domain', async () => {
    const user = userEvent.setup();
    renderSignUp();

    await user.type(screen.getByLabelText('Full Name'), 'Test');
    await user.type(screen.getByLabelText('Email'), 'user@gmail.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText(/not allowed/)).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('validates password length >= 8', async () => {
    const user = userEvent.setup();
    renderSignUp();

    await user.type(screen.getByLabelText('Full Name'), 'Test');
    await user.type(screen.getByLabelText('Email'), 'user@cgiar.org');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.type(screen.getByLabelText('Confirm Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Password must be at least 8 characters long.')).toBeInTheDocument();
  });

  it('validates passwords match', async () => {
    const user = userEvent.setup();
    renderSignUp();

    await user.type(screen.getByLabelText('Full Name'), 'Test');
    await user.type(screen.getByLabelText('Email'), 'user@cgiar.org');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'differentpass');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
  });

  it('calls signUp on valid submit', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue(undefined);
    renderSignUp();

    await user.type(screen.getByLabelText('Full Name'), 'John Doe');
    await user.type(screen.getByLabelText('Email'), 'john@cgiar.org');
    await user.type(screen.getByLabelText('Password'), 'securepass123');
    await user.type(screen.getByLabelText('Confirm Password'), 'securepass123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(mockSignUp).toHaveBeenCalledWith('john@cgiar.org', 'securepass123', 'John Doe');
  });

  it('maps UsernameExistsException to "already exists" message', async () => {
    const user = userEvent.setup();
    const error = new Error('User exists');
    error.name = 'UsernameExistsException';
    mockSignUp.mockRejectedValue(error);
    renderSignUp();

    await user.type(screen.getByLabelText('Full Name'), 'John');
    await user.type(screen.getByLabelText('Email'), 'john@cgiar.org');
    await user.type(screen.getByLabelText('Password'), 'securepass123');
    await user.type(screen.getByLabelText('Confirm Password'), 'securepass123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText(/already exists/)).toBeInTheDocument();
  });

  it('shows sign-in link', () => {
    renderSignUp();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });
});
