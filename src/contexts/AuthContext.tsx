import * as React from 'react';
import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  signOut as amplifySignOut,
  resetPassword as amplifyResetPassword,
  confirmResetPassword as amplifyConfirmResetPassword,
  signInWithRedirect,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { isCognitoConfigured, isSSOConfigured } from '@/lib/amplify';
import type { User, AuthState } from '@/types';

const { createContext, useContext, useState, useCallback, useEffect } = React;

// Dev mode mock user — only available in Vite dev server builds
const MOCK_USER: User = {
  id: 'dev-user-001',
  email: 'developer@cgiar.org',
  name: 'Dev User',
  createdAt: new Date().toISOString(),
};

// Demo mode — auto-authenticates all visitors without Cognito.
// Enabled via VITE_DEMO_MODE=true in env vars (works in production builds too).
const DEMO_USER: User = {
  id: 'demo-user',
  email: 'demo@cgiar.org',
  name: 'Demo User',
  createdAt: new Date().toISOString(),
};

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signInWithSSO: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmPasswordReset: (email: string, code: string, newPassword: string) => Promise<void>;
  getIdToken: () => Promise<string | null>;
  ssoAvailable: boolean;
  devModeEnabled: boolean;
  toggleDevMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Whether dev mode should be available. Only true in Vite dev server builds
 * AND when Cognito is not configured (so local development works without AWS).
 */
const canUseDevMode = import.meta.env.DEV && !isCognitoConfigured;
const autoAuth = isDemoMode || canUseDevMode;
const autoAuthUser = isDemoMode ? DEMO_USER : MOCK_USER;

/**
 * Load the current Cognito user as a User object.
 * Tries fetchUserAttributes first (works for email/password sign-in).
 * Falls back to ID token claims for OAuth/SSO flows, where the access token
 * lacks the aws.cognito.signin.user.admin scope needed by GetUser API.
 */
async function loadCognitoUser(): Promise<User> {
  const { userId } = await getCurrentUser();

  // Try the GetUser API first (requires aws.cognito.signin.user.admin scope)
  try {
    const attributes = await fetchUserAttributes();
    return {
      id: userId,
      email: attributes.email ?? '',
      name: attributes.name,
      createdAt: undefined,
    };
  } catch {
    // OAuth/SSO flows don't include the admin scope — read from ID token instead
    const session = await fetchAuthSession();
    const claims = session.tokens?.idToken?.payload;
    return {
      id: userId,
      email: (claims?.email as string) ?? '',
      name: (claims?.name as string) ?? undefined,
      createdAt: undefined,
    };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [devModeEnabled, setDevModeEnabled] = useState(canUseDevMode);
  const [authState, setAuthState] = useState<AuthState>({
    user: autoAuth ? autoAuthUser : null,
    isAuthenticated: autoAuth,
    isLoading: !autoAuth, // need to check session when not auto-authenticated
  });

  // Toggle dev mode — only works in dev builds without Cognito
  const toggleDevMode = useCallback(() => {
    if (!import.meta.env.DEV) return;
    setDevModeEnabled((prev) => {
      const newMode = !prev;
      if (newMode) {
        setAuthState({ user: MOCK_USER, isAuthenticated: true, isLoading: false });
      } else {
        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      }
      return newMode;
    });
  }, []);

  // Check existing Cognito session on mount
  useEffect(() => {
    if (isDemoMode || devModeEnabled) return;
    if (!isCognitoConfigured) {
      setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    // If we're returning from an OAuth redirect (?code= in the URL),
    // skip the session check — Amplify will process the callback internally
    // and fire a Hub event which the listener below will handle.
    const params = new URLSearchParams(window.location.search);
    if (params.has('code') && params.has('state')) {
      return; // Let Hub listener handle the OAuth callback
    }

    const checkSession = async () => {
      try {
        const user = await loadCognitoUser();
        setAuthState({ user, isAuthenticated: true, isLoading: false });
      } catch {
        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      }
    };

    checkSession();
  }, [devModeEnabled]);

  // Listen for OAuth redirect events (SSO callback)
  useEffect(() => {
    if (!isSSOConfigured) return;

    const unsubscribe = Hub.listen('auth', async ({ payload }) => {
      if (payload.event === 'signInWithRedirect') {
        try {
          const user = await loadCognitoUser();
          setAuthState({ user, isAuthenticated: true, isLoading: false });
        } catch {
          setAuthState({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
      if (payload.event === 'signInWithRedirect_failure') {
        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      }
    });

    return unsubscribe;
  }, []);

  // Sign in with Azure AD SSO
  const signInWithSSO = useCallback(async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      await signInWithRedirect({ provider: { custom: 'AzureAD' } });
    } catch (error) {
      // If there's already a signed-in user (e.g. from a previous SSO callback),
      // try to recover the session instead of showing an error.
      if (error instanceof Error && error.message.toLowerCase().includes('already')) {
        try {
          const user = await loadCognitoUser();
          setAuthState({ user, isAuthenticated: true, isLoading: false });
          return; // Session recovered — redirect will happen via the useEffect in SignIn page
        } catch {
          // Session is stale/broken — sign out to clear it so the next attempt works
          await amplifySignOut().catch(() => {});
          setAuthState({ user: null, isAuthenticated: false, isLoading: false });
          throw new Error('Previous session was cleared. Please try SSO again.');
        }
      }
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  // Sign in with Cognito
  const signIn = useCallback(async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      const { isSignedIn } = await amplifySignIn({ username: email, password });
      if (!isSignedIn) {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      const user = await loadCognitoUser();
      setAuthState({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      // If already signed in, try to load the existing session
      if (error instanceof Error && error.name === 'UserAlreadyAuthenticatedException') {
        try {
          const user = await loadCognitoUser();
          setAuthState({ user, isAuthenticated: true, isLoading: false });
          return;
        } catch {
          // Session is stale/invalid — sign out to clear it so the next attempt works
          await amplifySignOut().catch(() => {});
          setAuthState({ user: null, isAuthenticated: false, isLoading: false });
          throw new Error('Your previous session was invalid and has been cleared. Please sign in again.');
        }
      }
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  // Sign up with Cognito
  const signUp = useCallback(async (email: string, password: string, name: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      await amplifySignUp({
        username: email,
        password,
        options: { userAttributes: { email, name } },
      });
      // Don't sign in yet — user must confirm email first
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      if (isCognitoConfigured) {
        await amplifySignOut();
      }
      setAuthState({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  // Request password reset code
  const resetPasswordFn = useCallback(async (email: string) => {
    await amplifyResetPassword({ username: email });
  }, []);

  // Confirm password reset with code + new password
  const confirmPasswordReset = useCallback(
    async (email: string, code: string, newPassword: string) => {
      await amplifyConfirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      });
    },
    []
  );

  // Get the current id token for API calls
  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (isDemoMode || devModeEnabled || !isCognitoConfigured) return null;
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() ?? null;
    } catch {
      return null;
    }
  }, [devModeEnabled]);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signIn,
        signInWithSSO,
        signUp,
        signOut,
        resetPassword: resetPasswordFn,
        confirmPasswordReset,
        getIdToken,
        ssoAvailable: isSSOConfigured,
        devModeEnabled,
        toggleDevMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
