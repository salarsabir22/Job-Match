"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Zap, Eye, EyeOff, AlertCircle, CheckCircle2, KeyRound } from "lucide-react"

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

  const inputBase = "w-full h-11 px-4 rounded-xl bg-white border text-black text-sm placeholder:text-black/25 focus:outline-none transition-all duration-200"

  return (
    <div className="bg-white border border-black/10 rounded-2xl p-8 shadow-[0_0_50px_-10px_rgba(255,255,255,0.1)]">
      {/* Header */}
      <div className="text-center mb-7">
        <div className="w-14 h-14 rounded-2xl bg-neutral-200 flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_-5px_rgba(255,255,255,0.6)]">
          <Zap className="w-7 h-7 text-black" />
        </div>
        <h1 className="font-heading font-bold text-2xl text-black">Welcome back</h1>
        <p className="font-body text-neutral-700 text-sm mt-1">Sign in to your JobMatch account</p>
      </div>

      {/* Global error */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-neutral-500/25 mb-5">
          <AlertCircle className="h-4 w-4 text-neutral-500 shrink-0 mt-0.5" />
          <p className="font-body text-sm text-neutral-400">{error}</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-neutral-500/10 border border-neutral-500/25 mb-5">
          <CheckCircle2 className="h-4 w-4 text-neutral-400 shrink-0" />
          <p className="font-body text-sm text-neutral-300">Signed in! Redirecting you now…</p>
        </div>
      )}

      {/* Google */}
      <button onClick={handleGoogleLogin} disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-white/12 bg-white/5 text-black text-sm font-body font-medium hover:bg-white/10 hover:border-white/20 transition-all duration-200 mb-5 disabled:opacity-50">
        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        Continue with Google
      </button>

      <div className="relative flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-white/8" />
        <span className="font-data text-[10px] tracking-widest uppercase text-neutral-700">or email</span>
        <div className="flex-1 h-px bg-white/8" />
      </div>

      <form onSubmit={handleLogin} noValidate className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="font-data text-[11px] tracking-wider uppercase text-neutral-700">Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: undefined })); setError(null) }}
            autoComplete="email"
            className={`${inputBase} ${fieldErrors.email ? "border-neutral-500/60 focus:border-neutral-500" : "border-black/10 focus:border-[#FAFAFA]/60 focus:shadow-[0_0_15px_-5px_rgba(255,255,255,0.3)]"}`}
          />
          {fieldErrors.email && (
            <p className="flex items-center gap-1.5 text-xs text-neutral-500 font-body mt-1">
              <AlertCircle className="h-3 w-3 shrink-0" />{fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-data text-[11px] tracking-wider uppercase text-neutral-700">Password</label>
            <Link href="/forgot-password" className="font-body text-xs text-neutral-900 hover:text-neutral-600 transition-colors inline-flex items-center gap-1">
              <KeyRound className="h-3 w-3" />
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: undefined })); setError(null) }}
              autoComplete="current-password"
              className={`${inputBase} pr-11 ${fieldErrors.password ? "border-neutral-500/60 focus:border-neutral-500" : "border-black/10 focus:border-[#FAFAFA]/60 focus:shadow-[0_0_15px_-5px_rgba(255,255,255,0.3)]"}`}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-700 hover:text-black transition-colors p-1">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="flex items-center gap-1.5 text-xs text-neutral-500 font-body mt-1">
              <AlertCircle className="h-3 w-3 shrink-0" />{fieldErrors.password}
            </p>
          )}
        </div>

        <button type="submit" disabled={loading || success}
          className="w-full h-11 rounded-xl bg-black text-white font-body font-semibold text-sm shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.7)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : "Sign In"}
        </button>
      </form>

      <p className="font-body text-center text-sm text-neutral-700 mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-neutral-900 hover:text-neutral-600 font-medium transition-colors">
          Create one free
        </Link>
      </p>
    </div>
  )
}
