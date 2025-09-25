import { useEffect, useState } from "react"
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth"
import type { User } from "firebase/auth"
import { auth, googleProvider } from "@/lib/firebase"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const initials = (name?: string | null) => {
  if (!name) return "U"
  const [a, b] = name.split(" ").filter(Boolean)
  return `${a?.[0] ?? "U"}${b?.[0] ?? ""}`
}

const LoginCard = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const handleLogin = async () => {
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed")
    }
  }

  const handleLogout = async () => {
    setError(null)
    try {
      await signOut(auth)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-out failed")
    }
  }

  return (
    <div className="min-h-svh grid place-items-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Welcome</CardTitle>
          <CardDescription>Sign in with Google to continue</CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          {loading ? (
            <div className="text-sm opacity-70">Checking session…</div>
          ) : user ? (
            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? "User"} />
                  <AvatarFallback>{initials(user.displayName)}</AvatarFallback>
                </Avatar>

                <div className="leading-tight text-left">
                  <div className="font-medium">{user.displayName ?? user.email}</div>
                  <div className="text-xs opacity-70">{user.email}</div>
                </div>
              </div>

              <Button variant="default">
                Continue
              </Button>

              <Button variant="secondary" onClick={handleLogout}>
                Sign out
              </Button>
            </div>
          ) : (
            <Button className="justify-center" onClick={handleLogin}>
              Sign in with Google
            </Button>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginCard;
