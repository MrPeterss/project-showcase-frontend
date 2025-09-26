import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';

const initials = (name?: string | null) => {
  if (!name) return 'U';
  const [a, b] = name.split(' ').filter(Boolean);
  return `${a?.[0] ?? 'U'}${b?.[0] ?? ''}`;
};

const LoginCard = () => {
  const { firebaseUser, isAuthenticated, isLoading, error, signIn, signOut } =
    useAuth();

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
          ) : isAuthenticated ? (
            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={firebaseUser?.photoURL || undefined}
                    alt={firebaseUser?.displayName || 'User'}
                  />
                  <AvatarFallback>
                    {initials(firebaseUser?.displayName)}
                  </AvatarFallback>
                </Avatar>

                <div className="leading-tight text-left">
                  <div className="font-medium">
                    {firebaseUser?.displayName || firebaseUser?.email}
                  </div>
                  <div className="text-xs opacity-70">
                    {firebaseUser?.email}
                  </div>
                </div>
              </div>

              <Button variant="default" disabled={isLoading}>
                Continue
              </Button>

              <Button
                variant="secondary"
                onClick={async () => await signOut()}
                disabled={isLoading}
              >
                Sign out
              </Button>
            </div>
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
