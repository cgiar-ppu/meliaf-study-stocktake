import * as React from 'react';
import type { User, AuthState } from '@/types';

const { createContext, useContext, useState, useCallback, useEffect } = React;

// Dev mode flag - easily toggle to bypass auth during development
const DEV_MODE = true;

// Mock user for dev mode
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
  devModeEnabled: boolean;
  toggleDevMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [devModeEnabled, setDevModeEnabled] = useState(DEV_MODE);
  const [authState, setAuthState] = useState<AuthState>({
    user: DEV_MODE ? MOCK_USER : null,
    isAuthenticated: DEV_MODE,
    isLoading: false,
  });

  // Toggle dev mode - for testing purposes
  const toggleDevMode = useCallback(() => {
    setDevModeEnabled((prev) => {
      const newMode = !prev;
      if (newMode) {
        setAuthState({
          user: MOCK_USER,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
      return newMode;
    });
  }, []);

  // Sign in - placeholder for AWS Cognito integration
  const signIn = useCallback(async (email: string, _password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    
    try {
      // TODO: Replace with AWS Amplify Auth.signIn()
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      const user: User = {
        id: `user-${Date.now()}`,
        email,
        name: email.split('@')[0],
        createdAt: new Date().toISOString(),
      };
      
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  // Sign up - placeholder for AWS Cognito integration
  const signUp = useCallback(async (email: string, _password: string, name: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    
    try {
      // TODO: Replace with AWS Amplify Auth.signUp()
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      const user: User = {
        id: `user-${Date.now()}`,
        email,
        name,
        createdAt: new Date().toISOString(),
      };
      
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  // Sign out - placeholder for AWS Cognito integration
  const signOut = useCallback(async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    
    try {
      // TODO: Replace with AWS Amplify Auth.signOut()
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  // Password reset - placeholder for AWS Cognito integration
  const resetPassword = useCallback(async (_email: string) => {
    // TODO: Replace with AWS Amplify Auth.forgotPassword()
    await new Promise((resolve) => setTimeout(resolve, 500));
  }, []);

  // Check session on mount - placeholder for AWS Cognito
  useEffect(() => {
    if (devModeEnabled) return;
    
    const checkSession = async () => {
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      
      try {
        const storedUser = localStorage.getItem('meliaf_user');
        if (storedUser) {
          setAuthState({
            user: JSON.parse(storedUser),
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };
    
    checkSession();
  }, [devModeEnabled]);

  // Persist user to localStorage (mock session persistence)
  useEffect(() => {
    if (authState.user && !devModeEnabled) {
      localStorage.setItem('meliaf_user', JSON.stringify(authState.user));
    } else if (!authState.user) {
      localStorage.removeItem('meliaf_user');
    }
  }, [authState.user, devModeEnabled]);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signIn,
        signUp,
        signOut,
        resetPassword,
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
