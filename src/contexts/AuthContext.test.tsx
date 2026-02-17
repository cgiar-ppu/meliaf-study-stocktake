import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import * as React from 'react';

// ---------------------------------------------------------------------------
// Hoisted mocks — vi.hoisted runs before vi.mock factory functions
// ---------------------------------------------------------------------------
const {
  mockGetCurrentUser,
  mockFetchUserAttributes,
  mockFetchAuthSession,
  mockAmplifySignIn,
  mockAmplifySignUp,
  mockAmplifySignOut,
  mockSignInWithRedirect,
  mockResetPassword,
  mockConfirmResetPassword,
  mockHubListen,
  amplifyConfig,
} = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
  mockFetchUserAttributes: vi.fn(),
  mockFetchAuthSession: vi.fn(),
  mockAmplifySignIn: vi.fn(),
  mockAmplifySignUp: vi.fn(),
  mockAmplifySignOut: vi.fn(),
  mockSignInWithRedirect: vi.fn(),
  mockResetPassword: vi.fn(),
  mockConfirmResetPassword: vi.fn(),
  mockHubListen: vi.fn(() => vi.fn()),
  amplifyConfig: { isCognitoConfigured: true, isSSOConfigured: true },
}));

vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
  fetchUserAttributes: (...args: unknown[]) => mockFetchUserAttributes(...args),
  fetchAuthSession: (...args: unknown[]) => mockFetchAuthSession(...args),
  signIn: (...args: unknown[]) => mockAmplifySignIn(...args),
  signUp: (...args: unknown[]) => mockAmplifySignUp(...args),
  signOut: (...args: unknown[]) => mockAmplifySignOut(...args),
  signInWithRedirect: (...args: unknown[]) => mockSignInWithRedirect(...args),
  resetPassword: (...args: unknown[]) => mockResetPassword(...args),
  confirmResetPassword: (...args: unknown[]) => mockConfirmResetPassword(...args),
}));

vi.mock('aws-amplify/utils', () => ({
  Hub: { listen: (...args: unknown[]) => mockHubListen(...args) },
}));

vi.mock('@/lib/amplify', () => ({
  get isCognitoConfigured() {
    return amplifyConfig.isCognitoConfigured;
  },
  get isSSOConfigured() {
    return amplifyConfig.isSSOConfigured;
  },
}));

import { AuthProvider, useAuth } from './AuthContext';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

function renderAuth() {
  return renderHook(() => useAuth(), { wrapper });
}

beforeEach(() => {
  vi.clearAllMocks();
  amplifyConfig.isCognitoConfigured = true;
  amplifyConfig.isSSOConfigured = true;

  // Default: no session
  mockGetCurrentUser.mockRejectedValue(new Error('No user'));
  mockFetchUserAttributes.mockRejectedValue(new Error('No session'));
  mockFetchAuthSession.mockResolvedValue({ tokens: null });

  // Stub window.location.search
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...window.location, search: '' },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Session check on mount
// ---------------------------------------------------------------------------
describe('session check on mount', () => {
  it('sets authenticated state after successful getCurrentUser()', async () => {
    mockGetCurrentUser.mockResolvedValue({ userId: 'u1' });
    mockFetchUserAttributes.mockResolvedValue({ email: 'alice@cgiar.org', name: 'Alice' });

    const { result } = renderAuth();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('alice@cgiar.org');
  });

  it('sets unauthenticated when getCurrentUser() throws', async () => {
    mockGetCurrentUser.mockRejectedValue(new Error('No current user'));

    const { result } = renderAuth();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('falls back to ID token claims when fetchUserAttributes() throws', async () => {
    mockGetCurrentUser.mockResolvedValue({ userId: 'u2' });
    mockFetchUserAttributes.mockRejectedValue(new Error('No admin scope'));
    mockFetchAuthSession.mockResolvedValue({
      tokens: {
        idToken: {
          payload: { email: 'bob@cgiar.org', name: 'Bob' },
        },
      },
    });

    const { result } = renderAuth();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('bob@cgiar.org');
  });
});

// ---------------------------------------------------------------------------
// signIn
// ---------------------------------------------------------------------------
describe('signIn()', () => {
  it('calls Amplify signIn and loads user', async () => {
    mockAmplifySignIn.mockResolvedValue({ isSignedIn: true });
    mockGetCurrentUser.mockResolvedValue({ userId: 'u1' });
    mockFetchUserAttributes.mockResolvedValue({ email: 'alice@cgiar.org' });

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.signIn('alice@cgiar.org', 'password123');
    });

    expect(mockAmplifySignIn).toHaveBeenCalledWith({
      username: 'alice@cgiar.org',
      password: 'password123',
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('handles UserAlreadyAuthenticatedException', async () => {
    const error = new Error('User already authenticated');
    error.name = 'UserAlreadyAuthenticatedException';
    mockAmplifySignIn.mockRejectedValue(error);
    mockGetCurrentUser.mockResolvedValue({ userId: 'u1' });
    mockFetchUserAttributes.mockResolvedValue({ email: 'alice@cgiar.org' });

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.signIn('alice@cgiar.org', 'password123');
    });

    expect(result.current.isAuthenticated).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// signOut
// ---------------------------------------------------------------------------
describe('signOut()', () => {
  it('clears auth state', async () => {
    mockGetCurrentUser.mockResolvedValue({ userId: 'u1' });
    mockFetchUserAttributes.mockResolvedValue({ email: 'alice@cgiar.org' });
    mockAmplifySignOut.mockResolvedValue(undefined);

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// signInWithSSO
// ---------------------------------------------------------------------------
describe('signInWithSSO()', () => {
  it('calls signInWithRedirect with AzureAD provider', async () => {
    mockSignInWithRedirect.mockResolvedValue(undefined);

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.signInWithSSO();
    });

    expect(mockSignInWithRedirect).toHaveBeenCalledWith({
      provider: { custom: 'AzureAD' },
    });
  });
});

// ---------------------------------------------------------------------------
// getIdToken
// ---------------------------------------------------------------------------
describe('getIdToken()', () => {
  it('returns token when Cognito is configured', async () => {
    mockGetCurrentUser.mockResolvedValue({ userId: 'u1' });
    mockFetchUserAttributes.mockResolvedValue({ email: 'a@cgiar.org' });
    mockFetchAuthSession.mockResolvedValue({
      tokens: { idToken: { toString: () => 'my-id-token' } },
    });

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    let token: string | null = null;
    await act(async () => {
      token = await result.current.getIdToken();
    });
    expect(token).toBe('my-id-token');
  });

  it('returns null on error', async () => {
    mockGetCurrentUser.mockResolvedValue({ userId: 'u1' });
    mockFetchUserAttributes.mockResolvedValue({ email: 'a@cgiar.org' });
    mockFetchAuthSession.mockRejectedValue(new Error('session expired'));

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    let token: string | null = 'not-null';
    await act(async () => {
      token = await result.current.getIdToken();
    });
    expect(token).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// signUp
// ---------------------------------------------------------------------------
describe('signUp()', () => {
  it('calls amplifySignUp with correct args and stays unauthenticated', async () => {
    mockAmplifySignUp.mockResolvedValue({ isSignUpComplete: false });

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.signUp('alice@cgiar.org', 'Pass123!', 'Alice');
    });

    expect(mockAmplifySignUp).toHaveBeenCalledWith({
      username: 'alice@cgiar.org',
      password: 'Pass123!',
      options: { userAttributes: { email: 'alice@cgiar.org', name: 'Alice' } },
    });
    // Must confirm email before being authenticated
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('re-throws error and clears loading', async () => {
    mockAmplifySignUp.mockRejectedValue(new Error('UsernameExistsException'));

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(
      act(async () => {
        await result.current.signUp('alice@cgiar.org', 'Pass123!', 'Alice');
      }),
    ).rejects.toThrow('UsernameExistsException');
    expect(result.current.isLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// resetPassword + confirmPasswordReset
// ---------------------------------------------------------------------------
describe('resetPassword()', () => {
  it('calls amplifyResetPassword with username', async () => {
    mockResetPassword.mockResolvedValue({});

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.resetPassword('alice@cgiar.org');
    });

    expect(mockResetPassword).toHaveBeenCalledWith({ username: 'alice@cgiar.org' });
  });

  it('re-throws error on failure', async () => {
    mockResetPassword.mockRejectedValue(new Error('UserNotFoundException'));

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(
      act(async () => {
        await result.current.resetPassword('nobody@cgiar.org');
      }),
    ).rejects.toThrow('UserNotFoundException');
  });
});

describe('confirmPasswordReset()', () => {
  it('calls amplifyConfirmResetPassword with correct args', async () => {
    mockConfirmResetPassword.mockResolvedValue(undefined);

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.confirmPasswordReset('alice@cgiar.org', '123456', 'NewPass!');
    });

    expect(mockConfirmResetPassword).toHaveBeenCalledWith({
      username: 'alice@cgiar.org',
      confirmationCode: '123456',
      newPassword: 'NewPass!',
    });
  });

  it('re-throws error on failure', async () => {
    mockConfirmResetPassword.mockRejectedValue(new Error('CodeMismatchException'));

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(
      act(async () => {
        await result.current.confirmPasswordReset('alice@cgiar.org', 'wrong', 'NewPass!');
      }),
    ).rejects.toThrow('CodeMismatchException');
  });
});

// ---------------------------------------------------------------------------
// signOut error path
// ---------------------------------------------------------------------------
describe('signOut() error path', () => {
  it('propagates error and clears loading', async () => {
    mockGetCurrentUser.mockResolvedValue({ userId: 'u1' });
    mockFetchUserAttributes.mockResolvedValue({ email: 'alice@cgiar.org' });
    mockAmplifySignOut.mockRejectedValue(new Error('NetworkError'));

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await expect(
      act(async () => {
        await result.current.signOut();
      }),
    ).rejects.toThrow('NetworkError');
    expect(result.current.isLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// signIn additional branches
// ---------------------------------------------------------------------------
describe('signIn() additional branches', () => {
  it('returns early without authenticating when isSignedIn is false', async () => {
    mockAmplifySignIn.mockResolvedValue({ isSignedIn: false });

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.signIn('alice@cgiar.org', 'password');
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('re-throws generic errors (not UserAlreadyAuthenticatedException)', async () => {
    mockAmplifySignIn.mockRejectedValue(new Error('NotAuthorizedException'));

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(
      act(async () => {
        await result.current.signIn('alice@cgiar.org', 'wrongpassword');
      }),
    ).rejects.toThrow('NotAuthorizedException');
    expect(result.current.isLoading).toBe(false);
  });

  it('clears stale session when UserAlreadyAuthenticatedException + loadCognitoUser fails', async () => {
    const error = new Error('User already authenticated');
    error.name = 'UserAlreadyAuthenticatedException';
    mockAmplifySignIn.mockRejectedValue(error);
    // First call (mount session check) fails, second call (inside catch) also fails
    mockGetCurrentUser.mockRejectedValue(new Error('No user'));
    mockAmplifySignOut.mockResolvedValue(undefined);

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let thrown: Error | undefined;
    await act(async () => {
      try {
        await result.current.signIn('alice@cgiar.org', 'password');
      } catch (e) {
        thrown = e as Error;
      }
    });
    expect(thrown?.message).toContain('previous session was invalid');
    expect(mockAmplifySignOut).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// signInWithSSO error branches
// ---------------------------------------------------------------------------
describe('signInWithSSO() error branches', () => {
  it('recovers session when "already" error + loadCognitoUser succeeds', async () => {
    mockSignInWithRedirect.mockRejectedValue(new Error('There is already a signed in user'));
    mockGetCurrentUser.mockResolvedValue({ userId: 'u1' });
    mockFetchUserAttributes.mockResolvedValue({ email: 'alice@cgiar.org', name: 'Alice' });

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.signInWithSSO();
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('alice@cgiar.org');
  });

  it('clears session when "already" error + loadCognitoUser fails', async () => {
    mockSignInWithRedirect.mockRejectedValue(new Error('There is already a signed in user'));
    mockGetCurrentUser.mockRejectedValue(new Error('No user'));
    mockAmplifySignOut.mockResolvedValue(undefined);

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let thrown: Error | undefined;
    await act(async () => {
      try {
        await result.current.signInWithSSO();
      } catch (e) {
        thrown = e as Error;
      }
    });
    expect(thrown?.message).toContain('Previous session was cleared');
    expect(mockAmplifySignOut).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('re-throws non-"already" errors', async () => {
    mockSignInWithRedirect.mockRejectedValue(new Error('NetworkError'));

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(
      act(async () => {
        await result.current.signInWithSSO();
      }),
    ).rejects.toThrow('NetworkError');
    expect(result.current.isLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getIdToken — null when Cognito not configured
// ---------------------------------------------------------------------------
describe('getIdToken() when Cognito not configured', () => {
  it('returns null when isCognitoConfigured is false', async () => {
    amplifyConfig.isCognitoConfigured = false;

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let token: string | null = 'not-null';
    await act(async () => {
      token = await result.current.getIdToken();
    });
    expect(token).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Hub listener
// ---------------------------------------------------------------------------
describe('Hub listener', () => {
  it('sets unauthenticated on signInWithRedirect_failure', async () => {
    // Capture the Hub listener callback
    let hubCallback: ((data: { payload: { event: string } }) => void) | undefined;
    mockHubListen.mockImplementation((_channel: string, cb: (data: { payload: { event: string } }) => void) => {
      hubCallback = cb;
      return vi.fn();
    });

    // Start with an authenticated session
    mockGetCurrentUser.mockResolvedValue({ userId: 'u1' });
    mockFetchUserAttributes.mockResolvedValue({ email: 'alice@cgiar.org' });

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    // Simulate redirect failure
    await act(async () => {
      hubCallback?.({ payload: { event: 'signInWithRedirect_failure' } });
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// useAuth outside provider
// ---------------------------------------------------------------------------
describe('useAuth()', () => {
  it('throws when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });
});

// ---------------------------------------------------------------------------
// OAuth redirect detection
// ---------------------------------------------------------------------------
describe('OAuth redirect', () => {
  it('skips session check when ?code=&state= params are present', async () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, search: '?code=abc&state=xyz' },
    });

    const { result } = renderAuth();

    // Should stay loading since it defers to Hub listener
    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.isLoading).toBe(true);
  });
});
