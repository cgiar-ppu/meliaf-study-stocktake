import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

const { authState } = vi.hoisted(() => ({
  authState: {
    isAuthenticated: false,
    isLoading: false,
    devModeEnabled: false,
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    get isAuthenticated() { return authState.isAuthenticated; },
    get isLoading() { return authState.isLoading; },
    get devModeEnabled() { return authState.devModeEnabled; },
    user: null,
    signIn: vi.fn(),
    signInWithSSO: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getIdToken: vi.fn(),
    resetPassword: vi.fn(),
    confirmPasswordReset: vi.fn(),
    ssoAvailable: false,
    toggleDevMode: vi.fn(),
  }),
}));

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/signin" element={<div>Sign In Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.isAuthenticated = false;
    authState.isLoading = false;
    authState.devModeEnabled = false;
  });

  it('renders children when isAuthenticated is true', () => {
    authState.isAuthenticated = true;
    renderProtected();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to /signin when not authenticated', () => {
    authState.isAuthenticated = false;
    renderProtected();
    expect(screen.getByText('Sign In Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows loading spinner when isLoading is true', () => {
    authState.isLoading = true;
    renderProtected();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children in dev mode when devModeEnabled is true', () => {
    authState.isAuthenticated = false;
    authState.devModeEnabled = true;
    // import.meta.env.DEV is true in vitest
    renderProtected();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('does not bypass when devModeEnabled is false and not authenticated', () => {
    authState.isAuthenticated = false;
    authState.devModeEnabled = false;
    renderProtected();
    expect(screen.getByText('Sign In Page')).toBeInTheDocument();
  });
});
