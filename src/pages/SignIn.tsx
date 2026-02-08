import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import cgiarLogo from '@/assets/cgiar-logo.png';

function mapSignInError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'NotAuthorizedException') {
      return 'Incorrect email or password.';
    }
    if (error.name === 'UserNotConfirmedException') {
      return 'Please confirm your email address before signing in. Check your inbox for a confirmation link.';
    }
    if (error.name === 'UserAlreadyAuthenticatedException') {
      return 'You are already signed in.';
    }
  }
  return 'Invalid email or password. Please try again.';
}

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { signIn, isLoading, toggleDevMode, devModeEnabled } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  // Show success message when arriving from email confirmation
  useEffect(() => {
    if (searchParams.get('confirmed') === 'true') {
      setConfirmed(true);
      toast({
        title: 'Email confirmed',
        description: 'Your email has been confirmed. You can now sign in.',
      });
    }
  }, [searchParams, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(mapSignInError(err));
    }
  };

  const handleDevModeBypass = () => {
    if (!devModeEnabled) {
      toggleDevMode();
    }
    navigate(from, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="mb-8 text-center">
          <img src={cgiarLogo} alt="CGIAR" className="mx-auto mb-4 h-16 w-auto" />
          <h1 className="text-2xl font-bold text-foreground">MELIAF Study Stocktake</h1>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {confirmed && (
                <Alert className="border-success/30 bg-success/5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <AlertDescription className="text-success">
                    Your email has been confirmed. You can now sign in.
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@cgiar.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </div>

            {/* Dev Mode Bypass — only in dev builds */}
            {import.meta.env.DEV && (
              <div className="w-full border-t border-border pt-4">
                <Button
                  variant="outline"
                  className="w-full text-muted-foreground"
                  onClick={handleDevModeBypass}
                >
                  Skip (Dev Mode)
                </Button>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  For development and testing purposes only
                </p>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
