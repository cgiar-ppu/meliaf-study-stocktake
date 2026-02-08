import * as React from 'react';
import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  signOut as amplifySignOut,
  resetPassword as amplifyResetPassword,
  confirmResetPassword as amplifyConfirmResetPassword,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
} from 'aws-amplify/auth';
import { isCognitoConfigured } from '@/lib/amplify';
import type { User, AuthState } from '@/types';

const { createContext, useContext, useState, useCallback, useEffect } = React;

// Dev mode mock user — only available in Vite dev server builds
const MOCK_USER: User = {
  id: 'dev-user-001',
  email: 'developer@cgiar.org',
  name: 'Dev User',
  createdAt: new Date().toISOString(),
};

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmPasswordReset: (email: string, code: string, newPassword: string) => Promise<void>;
  getIdToken: () => Promise<string | null>;
  devModeEnabled: boolean;
  toggleDevMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Whether dev mode should be available. Only true in Vite dev server builds
 * AND when Cognito is not configured (so local development works without AWS).
 */
const canUseDevMode = import.meta.env.DEV && !isCognitoConfigured;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [devModeEnabled, setDevModeEnabled] = useState(canUseDevMode);
  const [authState, setAuthState] = useState<AuthState>({
    user: canUseDevMode ? MOCK_USER : null,
    isAuthenticated: canUseDevMode,
    isLoading: !canUseDevMode, // need to check session when not in dev mode
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
    if (devModeEnabled) return;
    if (!isCognitoConfigured) {
      setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    const checkSession = async () => {
      try {
        const cognitoUser = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        setAuthState({
          user: {
            id: cognitoUser.userId,
            email: attributes.email ?? '',
            name: attributes.name,
            createdAt: undefined,
          },
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      }
    };

    checkSession();
  }, [devModeEnabled]);

  // Sign in with Cognito
  const signIn = useCallback(async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      const { isSignedIn } = await amplifySignIn({ username: email, password });
      if (!isSignedIn) {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      const cognitoUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      setAuthState({
        user: {
          id: cognitoUser.userId,
          email: attributes.email ?? email,
          name: attributes.name,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      // If already signed in, just load the existing session
      if (error instanceof Error && error.name === 'UserAlreadyAuthenticatedException') {
        const cognitoUser = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        setAuthState({
          user: {
            id: cognitoUser.userId,
            email: attributes.email ?? email,
            name: attributes.name,
          },
          isAuthenticated: true,
          isLoading: false,
        });
        return;
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
    if (devModeEnabled || !isCognitoConfigured) return null;
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
        signUp,
        signOut,
        resetPassword: resetPasswordFn,
        confirmPasswordReset,
        getIdToken,
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
