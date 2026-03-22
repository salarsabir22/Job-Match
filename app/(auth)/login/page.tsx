"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Eye, EyeOff } from "lucide-react"

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [success, setSuccess] = useState(false)

  const validate = () => {
    const errs: { email?: string; password?: string } = {}
    if (!email) errs.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address"
    if (!password) errs.password = "Password is required"
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      if (error.message.includes("Invalid login")) setError("Incorrect email or password. Please try again.")
      else if (error.message.includes("Email not confirmed")) setError("Please verify your email before signing in. Check your inbox.")
      else setError(error.message)
      return
    }
    setSuccess(true)
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle()
    if (!profile) window.location.href = "/onboarding"
    else if (profile.role === "student") window.location.href = "/discover"
    else if (profile.role === "recruiter") window.location.href = "/jobs"
    else if (profile.role === "admin") window.location.href = "/admin/users"
    else window.location.href = "/onboarding"
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError("Google sign-in failed. Please try again.")
      setGoogleLoading(false)
    }
  }

  return (
    <div className="auth-card">
      {/* Header */}
      <div className="text-center mb-7">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Account</p>
        <h1 className="mt-3 text-[20px] sm:text-[21px] font-semibold tracking-[-0.03em] text-foreground">Welcome back</h1>
        <p className="font-body text-muted-foreground text-[15px] mt-2">Sign in to JobMatch</p>
      </div>

      {/* Global error */}
      {error && (
        <div className="border-l-2 border-destructive/80 bg-destructive/10 pl-4 pr-3 py-3 rounded-r-xl mb-5">
          <p className="font-body text-[14px] leading-snug text-destructive">{error}</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="border border-border bg-muted/50 px-4 py-3 rounded-xl mb-5">
          <p className="font-body text-[14px] text-foreground">Signed in. Redirecting…</p>
        </div>
      )}

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="auth-btn-google mb-5 disabled:opacity-45"
      >
        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        Continue with Google
      </button>

      <div className="relative flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-border" />
        <span className="font-data text-[10px] tracking-[0.2em] uppercase text-muted-foreground">or email</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleLogin} noValidate className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="font-data text-[11px] tracking-[0.2em] uppercase text-muted-foreground">Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: undefined })); setError(null) }}
            autoComplete="email"
            className={`auth-input ${fieldErrors.email ? "border-destructive/60" : ""}`}
          />
          {fieldErrors.email && (
            <p className="text-xs text-destructive font-body mt-1 pl-0.5">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label className="font-data text-[11px] tracking-[0.2em] uppercase text-muted-foreground">Password</label>
            <Link href="/forgot-password" className="font-body text-xs text-primary hover:opacity-80 transition-colors">
              Forgot password
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: undefined })); setError(null) }}
              autoComplete="current-password"
              className={`auth-input pr-11 ${fieldErrors.password ? "border-destructive/60" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-xs text-destructive font-body mt-1 pl-0.5">{fieldErrors.password}</p>
          )}
        </div>

        <button type="submit" disabled={loading || success} className="auth-btn-primary disabled:opacity-45 disabled:pointer-events-none">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : "Sign in"}
        </button>
      </form>

      <p className="font-body text-center text-sm text-muted-foreground mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary font-medium hover:opacity-80 transition-colors">
          Create one
        </Link>
      </p>
    </div>
  )
}
