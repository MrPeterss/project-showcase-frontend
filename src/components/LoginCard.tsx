import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const LoginCard = () => {
  const { isAuthenticated, isLoading, error, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state or query params, default to /courses
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  const stateFrom = (location.state as any)?.from;
  const from = redirectParam || stateFrom || '/courses';

  // Redirect to original page or courses page when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  return (
    <div className="min-h-svh grid place-items-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Welcome</CardTitle>
          <CardDescription>Sign in with Google to continue</CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          {isLoading ? (
            <div className="text-sm opacity-70">Checking session…</div>
          ) : (
            <Button
              className="justify-center"
              onClick={async () => await signIn()}
              disabled={isLoading}
            >
              Sign in with Google
            </Button>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginCard;
