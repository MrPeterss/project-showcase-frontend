import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const LoginCard = () => {
  const { isAuthenticated, isLoading, error, signIn } = useAuth();
  const navigate = useNavigate();

  // Redirect to courses page when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/courses', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
