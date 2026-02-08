import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import cgiarLogo from '@/assets/cgiar-logo.png';

export default function ConfirmEmail() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src={cgiarLogo} alt="CGIAR" className="mx-auto mb-4 h-16 w-auto" />
          <h1 className="text-2xl font-bold text-foreground">MELIAF Study Stocktake</h1>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Check your email</CardTitle>
            <CardDescription>
              We've sent a confirmation link to your email address. Click the link to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center text-sm text-muted-foreground">
            <p>
              The link will expire after 24 hours. If you don't see the email, check your spam folder.
            </p>
          </CardContent>
          <CardFooter>
            <Link
              to="/signin"
              className="w-full text-center text-sm font-medium text-primary hover:underline"
            >
              Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
