import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';

const { mockResetPassword, mockConfirmPasswordReset } = vi.hoisted(() => ({
  mockResetPassword: vi.fn(),
  mockConfirmPasswordReset: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    resetPassword: mockResetPassword,
    confirmPasswordReset: mockConfirmPasswordReset,
    isAuthenticated: false,
    isLoading: false,
    user: null,
    signIn: vi.fn(),
    signInWithSSO: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getIdToken: vi.fn(),
    ssoAvailable: false,
    devModeEnabled: false,
    toggleDevMode: vi.fn(),
  }),
}));

vi.mock('@/assets/cgiar-logo.png', () => ({ default: 'logo.png' }));

function renderForgotPassword() {
  return render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <ForgotPassword />
    </MemoryRouter>
  );
}

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows email input and send button on request step', () => {
    renderForgotPassword();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send verification code' })).toBeInTheDocument();
  });

  it('validates email is required on empty submit', async () => {
    const user = userEvent.setup();
    renderForgotPassword();

    await user.click(screen.getByRole('button', { name: 'Send verification code' }));

    expect(await screen.findByText('Please enter your email address.')).toBeInTheDocument();
  });

  it('advances to confirm step after calling resetPassword', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue(undefined);
    renderForgotPassword();

    await user.type(screen.getByLabelText('Email'), 'user@cgiar.org');
    await user.click(screen.getByRole('button', { name: 'Send verification code' }));

    expect(await screen.findByLabelText('Verification Code')).toBeInTheDocument();
  });

  it('shows code, new password, and confirm password inputs on confirm step', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue(undefined);
    renderForgotPassword();

    await user.type(screen.getByLabelText('Email'), 'user@cgiar.org');
    await user.click(screen.getByRole('button', { name: 'Send verification code' }));

    expect(await screen.findByLabelText('Verification Code')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
  });

  it('validates all fields required on confirm step', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue(undefined);
    renderForgotPassword();

    await user.type(screen.getByLabelText('Email'), 'user@cgiar.org');
    await user.click(screen.getByRole('button', { name: 'Send verification code' }));

    await screen.findByLabelText('Verification Code');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(await screen.findByText('Please fill in all fields.')).toBeInTheDocument();
  });

  it('validates passwords match on confirm step', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue(undefined);
    renderForgotPassword();

    await user.type(screen.getByLabelText('Email'), 'user@cgiar.org');
    await user.click(screen.getByRole('button', { name: 'Send verification code' }));

    await screen.findByLabelText('Verification Code');
    await user.type(screen.getByLabelText('Verification Code'), '123456');
    await user.type(screen.getByLabelText('New Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm New Password'), 'different');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
  });

  it('calls confirmPasswordReset on valid confirm', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue(undefined);
    mockConfirmPasswordReset.mockResolvedValue(undefined);
    renderForgotPassword();

    await user.type(screen.getByLabelText('Email'), 'user@cgiar.org');
    await user.click(screen.getByRole('button', { name: 'Send verification code' }));

    await screen.findByLabelText('Verification Code');
    await user.type(screen.getByLabelText('Verification Code'), '123456');
    await user.type(screen.getByLabelText('New Password'), 'newpass123');
    await user.type(screen.getByLabelText('Confirm New Password'), 'newpass123');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(mockConfirmPasswordReset).toHaveBeenCalledWith('user@cgiar.org', '123456', 'newpass123');
  });

  it('maps CodeMismatchException to "Invalid verification code"', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue(undefined);
    const error = new Error('Bad code');
    error.name = 'CodeMismatchException';
    mockConfirmPasswordReset.mockRejectedValue(error);
    renderForgotPassword();

    await user.type(screen.getByLabelText('Email'), 'user@cgiar.org');
    await user.click(screen.getByRole('button', { name: 'Send verification code' }));

    await screen.findByLabelText('Verification Code');
    await user.type(screen.getByLabelText('Verification Code'), '000000');
    await user.type(screen.getByLabelText('New Password'), 'newpass123');
    await user.type(screen.getByLabelText('Confirm New Password'), 'newpass123');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(await screen.findByText(/Invalid verification code/)).toBeInTheDocument();
  });

  it('shows success message on done step with back to sign in link', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue(undefined);
    mockConfirmPasswordReset.mockResolvedValue(undefined);
    renderForgotPassword();

    await user.type(screen.getByLabelText('Email'), 'user@cgiar.org');
    await user.click(screen.getByRole('button', { name: 'Send verification code' }));

    await screen.findByLabelText('Verification Code');
    await user.type(screen.getByLabelText('Verification Code'), '123456');
    await user.type(screen.getByLabelText('New Password'), 'newpass123');
    await user.type(screen.getByLabelText('Confirm New Password'), 'newpass123');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(await screen.findByText(/You can now sign in with your new password/)).toBeInTheDocument();
    expect(screen.getByText('Back to sign in')).toBeInTheDocument();
  });
});
