"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Loader2, Eye, EyeOff } from "lucide-react"

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

type PasswordStrength = { score: 0 | 1 | 2 | 3 | 4; label: string; color: string }

function getPasswordStrength(pw: string): PasswordStrength {
  if (!pw) return { score: 0, label: "", color: "" }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const map: Record<number, PasswordStrength> = {
    0: { score: 0, label: "", color: "" },
    1: { score: 1, label: "Weak", color: "bg-red-500" },
    2: { score: 2, label: "Fair", color: "bg-neutral-400" },
    3: { score: 3, label: "Good", color: "bg-blue-500" },
    4: { score: 4, label: "Strong", color: "bg-neutral-1000" },
  }
  return map[score as keyof typeof map]
}

type SignupRole = "student" | "recruiter"

const ROLE_INFO: Record<SignupRole, { label: string; description: string }> = {
  student: {
    label: "Student",
    description: "Browse roles, get matched, message when it’s mutual.",
  },
  recruiter: {
    label: "Recruiter",
    description: "Post jobs and shortlist candidates — account review may apply.",
  },
}

export default function SignupPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<SignupRole>("student")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [verifyMode, setVerifyMode] = useState(false)

  const strength = getPasswordStrength(password)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!fullName.trim()) errs.fullName = "Full name is required"
    else if (fullName.trim().length < 2) errs.fullName = "Name must be at least 2 characters"
    if (!email) errs.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address"
    if (!password) errs.password = "Password is required"
    else if (password.length < 6) errs.password = "Password must be at least 6 characters"
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const clearFieldError = (field: string) => {
    setFieldErrors(p => { const n = { ...p }; delete n[field]; return n })
    setError(null)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim(), role } },
    })
    if (error) {
      setLoading(false)
      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        setError("An account with this email already exists. Try signing in instead.")
      } else {
        setError(error.message)
      }
      return
    }
    if (data.session) {
      const supabase2 = createClient()
      await supabase2.from("profiles").update({ role }).eq("id", data.user!.id)
      window.location.href = "/onboarding"
    } else if (data.user) {
      setVerifyMode(true)
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError(null)
    setGoogleLoading(true)
    localStorage.setItem("pending_role", role)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      localStorage.removeItem("pending_role")
      setError("Google signup failed. Please try again.")
      setGoogleLoading(false)
    }
  }

  const inputBase =
    "w-full min-h-[3.25rem] px-5 rounded-full border border-white/[0.15] bg-white/[0.07] text-[15px] text-white placeholder:text-white/30 backdrop-blur-sm focus:outline-none focus:border-white/35 focus:ring-2 focus:ring-white/[0.08] transition-all duration-300"

  if (verifyMode) {
    return (
      <div className="rounded-2xl border border-white/[0.12] bg-white/[0.06] px-6 py-8 sm:px-8 text-center backdrop-blur-sm">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/35">Verify email</p>
        <h2 className="mt-4 text-[18px] font-semibold tracking-[-0.03em] text-white mb-2">Check your inbox</h2>
        <p className="font-body text-white/45 text-sm mb-1">We sent a confirmation link to</p>
        <p className="font-body text-white font-medium text-sm mb-5">{email}</p>
        <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/[0.1] mb-5 text-left">
          <p className="font-data text-[11px] tracking-[0.2em] uppercase text-white/38 mb-2">Next steps</p>
          <ol className="list-decimal list-inside space-y-1">
            <li className="font-body text-xs text-white/50">Open the email from JobMatch</li>
            <li className="font-body text-xs text-white/50">Click &quot;Confirm your email&quot;</li>
            <li className="font-body text-xs text-white/50">Complete your profile</li>
          </ol>
        </div>
        <p className="font-body text-xs text-white/40">
          Didn&apos;t receive it? Check spam or{" "}
          <button type="button" onClick={() => setVerifyMode(false)} className="text-white hover:underline">
            try again
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/[0.12] bg-white/[0.06] px-6 py-8 sm:px-8 sm:py-10 backdrop-blur-sm">
      <div className="text-center mb-7">
        <p className="font-data text-[10px] tracking-[0.25em] uppercase text-white/38 mb-2">Welcome</p>
        <h1 className="text-[18px] sm:text-[19px] font-semibold tracking-[-0.02em] text-white">Create your account</h1>
        <p className="font-body text-white/45 text-sm mt-1.5">Free — under a minute</p>
      </div>

      {/* Role selector */}
      <div className="mb-5">
        <p className="font-data text-[11px] tracking-[0.2em] uppercase text-white/38 mb-2">I am joining as…</p>
        <div className="grid grid-cols-2 gap-3">
          {(["student", "recruiter"] as SignupRole[]).map((r) => {
            const { label, description } = ROLE_INFO[r]
            const active = role === r
            return (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={cn(
                  "rounded-2xl border px-3.5 py-3 text-left transition-all duration-200",
                  active
                    ? "border-white/35 bg-white/[0.1]"
                    : "border-white/[0.1] bg-white/[0.03] hover:border-white/20"
                )}>
                <p className={cn("text-[13px] font-semibold tracking-[-0.02em]", active ? "text-white" : "text-white/80")}>
                  {label}
                </p>
                <p className="mt-1.5 text-[11px] leading-snug text-white/38">{description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Global error */}
      {error && (
        <div className="border-l-2 border-red-400/50 bg-red-500/[0.08] pl-4 pr-3 py-3 rounded-r-xl mb-5">
          <div>
            <p className="font-body text-[14px] leading-snug text-red-100/90">{error}</p>
            {error.includes("already exists") && (
              <Link href="/login" className="font-body text-xs text-white mt-1 inline-block hover:underline">
                Go to sign in →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Google */}
      <button onClick={handleGoogleSignup} disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-3 min-h-[3.25rem] rounded-full border border-white/[0.15] bg-white/[0.05] text-white text-[15px] font-medium hover:bg-white/[0.09] transition-all duration-300 mb-4 disabled:opacity-45">
        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        Google — {role === "student" ? "Student" : "Recruiter"}
      </button>

      <div className="relative flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-white/10" />
        <span className="font-data text-[10px] tracking-[0.2em] uppercase text-white/38">or email</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <form onSubmit={handleSignup} noValidate className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="font-data text-[11px] tracking-[0.2em] uppercase text-white/38">Full name</label>
          <input
            placeholder="Jane Smith"
            value={fullName}
            onChange={(e) => { setFullName(e.target.value); clearFieldError("fullName") }}
            autoComplete="name"
            className={`${inputBase} ${fieldErrors.fullName ? "border-red-400/50" : ""}`}
          />
          {fieldErrors.fullName && (
            <p className="text-xs text-red-300/90 font-body pl-0.5">{fieldErrors.fullName}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="font-data text-[11px] tracking-[0.2em] uppercase text-white/38">Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearFieldError("email") }}
            autoComplete="email"
            className={`${inputBase} ${fieldErrors.email ? "border-red-400/50" : ""}`}
          />
          {fieldErrors.email && (
            <p className="text-xs text-red-300/90 font-body pl-0.5">{fieldErrors.email}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="font-data text-[11px] tracking-[0.2em] uppercase text-white/38">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearFieldError("password") }}
              autoComplete="new-password"
              className={`${inputBase} pr-11 ${fieldErrors.password ? "border-red-400/50" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors p-1"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-300", i <= strength.score ? strength.color : "bg-white/10")} />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="font-data text-[10px] text-white/40">
                  {strength.score < 3 && "Use uppercase, numbers & symbols"}
                  {strength.score >= 3 && (
                    <span className="text-white/55">{strength.label} password</span>
                  )}
                </p>
              </div>
            </div>
          )}
          {fieldErrors.password && (
            <p className="text-xs text-red-300/90 font-body pl-0.5">{fieldErrors.password}</p>
          )}
        </div>

        {role === "recruiter" && (
          <div className="border-l-2 border-white/15 bg-white/[0.03] pl-3.5 py-2.5 rounded-r-lg">
            <p className="font-body text-[11px] text-white/42 leading-relaxed">
              Recruiter accounts are reviewed before you can post jobs.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[3.25rem] rounded-full bg-white text-black font-semibold text-[15px] tracking-[-0.01em] hover:bg-white/90 transition-all duration-300 disabled:opacity-45 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</> : "Create account"}
        </button>
      </form>

      <p className="font-body text-center text-sm text-white/45 mt-5">
        Already have an account?{" "}
        <Link href="/login" className="text-white font-medium hover:text-white/90 transition-colors">
          Sign in
        </Link>
      </p>

      <p className="font-body text-center text-[10px] text-white/30 mt-4">
        By signing up you agree to our{" "}
        <a href="#" className="text-white/45 hover:text-white/65 underline underline-offset-2">
          Terms
        </a>{" "}
        and{" "}
        <a href="#" className="text-white/45 hover:text-white/65 underline underline-offset-2">
          Privacy
        </a>
      </p>
    </div>
  )
}
