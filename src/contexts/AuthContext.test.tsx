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
