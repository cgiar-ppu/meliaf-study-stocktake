import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ─── Hoisted mutable state ───
const { authState, retryHolder } = vi.hoisted(() => ({
  authState: {
    isAuthenticated: false,
    isLoading: false,
    devModeEnabled: false,
  },
  retryHolder: {
    fn: undefined as ((failureCount: number, error: unknown) => boolean) | undefined,
  },
}));

// ─── Mock lazy-loaded pages ───
vi.mock('./pages/Introduction', () => ({ default: () => 'Introduction Page' }));
vi.mock('./pages/Dashboard', () => ({ default: () => 'Dashboard Page' }));
vi.mock('./pages/SubmitStudy', () => ({ default: () => 'Submit Study Page' }));
vi.mock('./pages/MySubmissions', () => ({ default: () => 'My Submissions Page' }));
vi.mock('./pages/SignIn', () => ({ default: () => 'Sign In Page' }));
vi.mock('./pages/SignUp', () => ({ default: () => 'Sign Up Page' }));
vi.mock('./pages/ForgotPassword', () => ({ default: () => 'Forgot Password Page' }));
vi.mock('./pages/ConfirmEmail', () => ({ default: () => 'Confirm Email Page' }));
vi.mock('./pages/EditSubmission', () => ({ default: () => 'Edit Submission Page' }));
vi.mock('./pages/NotFound', () => ({ default: () => 'Not Found Page' }));

// ─── Mock auth ───
vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    get isAuthenticated() { return authState.isAuthenticated; },
    get isLoading() { return authState.isLoading; },
    get devModeEnabled() { return authState.devModeEnabled; },
    get user() {
      return authState.isAuthenticated
        ? { id: 'u1', email: 'test@test.com', name: 'Test', createdAt: '' }
        : null;
    },
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

// ─── Mock layout and UI providers ───
vi.mock('@/components/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/components/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/components/ui/toaster', () => ({ Toaster: () => null }));
vi.mock('@/components/ui/sonner', () => ({ Toaster: () => null }));
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ─── Intercept QueryClient to capture retry function ───
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query',
  );
  return {
    ...actual,
    QueryClient: class extends actual.QueryClient {
      constructor(options?: ConstructorParameters<typeof actual.QueryClient>[0]) {
        super(options);
        const retry = options?.defaultOptions?.queries?.retry;
        if (typeof retry === 'function') {
          retryHolder.fn = retry as (failureCount: number, error: unknown) => boolean;
        }
      }
    },
  };
});

import App from './App';

beforeEach(() => {
  authState.isAuthenticated = false;
  authState.isLoading = false;
  authState.devModeEnabled = false;
});

function renderApp(path: string) {
  window.history.pushState({}, '', path);
  return render(<App />);
}

// ---------------------------------------------------------------------------
// Route tree
// ---------------------------------------------------------------------------
describe('App routes', () => {
  describe('public routes render without auth', () => {
    it('/signin', async () => {
      renderApp('/signin');
      expect(await screen.findByText('Sign In Page')).toBeInTheDocument();
    });

    it('/signup', async () => {
      renderApp('/signup');
      expect(await screen.findByText('Sign Up Page')).toBeInTheDocument();
    });

    it('/forgot-password', async () => {
      renderApp('/forgot-password');
      expect(await screen.findByText('Forgot Password Page')).toBeInTheDocument();
    });

    it('/confirm-email', async () => {
      renderApp('/confirm-email');
      expect(await screen.findByText('Confirm Email Page')).toBeInTheDocument();
    });
  });

  describe('protected routes redirect to /signin when unauthenticated', () => {
    it('/ redirects', async () => {
      renderApp('/');
      expect(await screen.findByText('Sign In Page')).toBeInTheDocument();
    });

    it('/submissions redirects', async () => {
      renderApp('/submissions');
      expect(await screen.findByText('Sign In Page')).toBeInTheDocument();
    });

    it('/dashboard redirects', async () => {
      renderApp('/dashboard');
      expect(await screen.findByText('Sign In Page')).toBeInTheDocument();
    });

    it('/submit redirects', async () => {
      renderApp('/submit');
      expect(await screen.findByText('Sign In Page')).toBeInTheDocument();
    });
  });

  describe('protected routes render content when authenticated', () => {
    beforeEach(() => {
      authState.isAuthenticated = true;
    });

    it('/ renders Introduction', async () => {
      renderApp('/');
      expect(await screen.findByText('Introduction Page')).toBeInTheDocument();
    });

    it('/submissions renders MySubmissions', async () => {
      renderApp('/submissions');
      expect(await screen.findByText('My Submissions Page')).toBeInTheDocument();
    });

    it('/dashboard renders Dashboard', async () => {
      renderApp('/dashboard');
      expect(await screen.findByText('Dashboard Page')).toBeInTheDocument();
    });

    it('/submit renders SubmitStudy', async () => {
      renderApp('/submit');
      expect(await screen.findByText('Submit Study Page')).toBeInTheDocument();
    });

    it('/submit/:submissionId renders EditSubmission', async () => {
      renderApp('/submit/abc-123');
      expect(await screen.findByText('Edit Submission Page')).toBeInTheDocument();
    });
  });

  describe('catch-all', () => {
    it('renders NotFound for unknown paths', async () => {
      renderApp('/nonexistent-route');
      expect(await screen.findByText('Not Found Page')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// QueryClient retry logic
// ---------------------------------------------------------------------------
describe('QueryClient retry logic', () => {
  it('captures the retry function from QueryClient config', () => {
    expect(retryHolder.fn).toBeTypeOf('function');
  });

  it('does not retry on 401 errors', () => {
    const error = Object.assign(new Error('Unauthorized'), { status: 401 });
    expect(retryHolder.fn!(0, error)).toBe(false);
  });

  it('does not retry on 403 errors', () => {
    const error = Object.assign(new Error('Forbidden'), { status: 403 });
    expect(retryHolder.fn!(0, error)).toBe(false);
  });

  it('retries on other errors when failureCount < 3', () => {
    const error = new Error('Network error');
    expect(retryHolder.fn!(0, error)).toBe(true);
    expect(retryHolder.fn!(1, error)).toBe(true);
    expect(retryHolder.fn!(2, error)).toBe(true);
  });

  it('stops retrying after 3 failures', () => {
    const error = new Error('Network error');
    expect(retryHolder.fn!(3, error)).toBe(false);
  });
});
