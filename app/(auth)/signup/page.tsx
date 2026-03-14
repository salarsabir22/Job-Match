"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types"
import {
  Loader2, GraduationCap, Building2, Zap, Eye, EyeOff,
  AlertCircle, CheckCircle2, Info, Mail
} from "lucide-react"

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
    2: { score: 2, label: "Fair", color: "bg-yellow-500" },
    3: { score: 3, label: "Good", color: "bg-blue-500" },
    4: { score: 4, label: "Strong", color: "bg-green-500" },
  }
  return map[score as keyof typeof map]
}

type SignupRole = "student" | "recruiter"

const ROLE_INFO: Record<SignupRole, { icon: React.ElementType; label: string; description: string }> = {
  student: {
    icon: GraduationCap,
    label: "Student / Job Seeker",
    description: "Browse and swipe on jobs, get matched with recruiters, connect with your community",
  },
  recruiter: {
    icon: Building2,
    label: "Recruiter / Employer",
    description: "Post positions, discover top student talent, manage applications — pending admin approval",
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

  const inputBase = "w-full h-11 px-4 rounded-xl bg-[#030304] border text-white text-sm placeholder:text-white/25 focus:outline-none transition-all duration-200"

  if (verifyMode) {
    return (
      <div className="bg-[#0F1115] border border-white/8 rounded-2xl p-8 text-center shadow-[0_0_50px_-10px_rgba(247,147,26,0.1)]">
        <div className="w-16 h-16 rounded-2xl bg-[#F7931A]/15 border border-[#F7931A]/30 flex items-center justify-center mx-auto mb-5">
          <Mail className="h-8 w-8 text-[#F7931A]" />
        </div>
        <h2 className="font-heading font-bold text-xl text-white mb-2">Check your inbox</h2>
        <p className="font-body text-[#94A3B8] text-sm mb-1">
          We sent a confirmation link to
        </p>
        <p className="font-body text-white font-medium text-sm mb-5">{email}</p>
        <div className="p-3.5 rounded-xl bg-[#F7931A]/10 border border-[#F7931A]/25 mb-5 text-left">
          <p className="font-data text-[11px] tracking-wider uppercase text-[#F7931A] mb-1">What to do next</p>
          <ol className="list-decimal list-inside space-y-1">
            <li className="font-body text-xs text-[#94A3B8]">Open the email from JobMatch</li>
            <li className="font-body text-xs text-[#94A3B8]">Click the &quot;Confirm your email&quot; button</li>
            <li className="font-body text-xs text-[#94A3B8]">You&apos;ll be taken directly to setup your profile</li>
          </ol>
        </div>
        <p className="font-body text-xs text-[#94A3B8]">
          Didn&apos;t receive it? Check spam or{" "}
          <button onClick={() => setVerifyMode(false)} className="text-[#F7931A] hover:underline">try again</button>
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[#0F1115] border border-white/8 rounded-2xl p-8 shadow-[0_0_50px_-10px_rgba(247,147,26,0.1)]">
      <div className="text-center mb-7">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_-5px_rgba(247,147,26,0.6)]">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-heading font-bold text-2xl text-white">Create your account</h1>
        <p className="font-body text-[#94A3B8] text-sm mt-1">It&apos;s free — takes less than a minute</p>
      </div>

      {/* Role selector */}
      <div className="mb-5">
        <p className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8] mb-2">I am joining as a…</p>
        <div className="grid grid-cols-2 gap-3">
          {(["student", "recruiter"] as SignupRole[]).map((r) => {
            const { icon: Icon, label, description } = ROLE_INFO[r]
            const active = role === r
            return (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border-2 p-3.5 text-left transition-all duration-200",
                  active
                    ? "border-[#F7931A] bg-[#F7931A]/10 shadow-[0_0_15px_-5px_rgba(247,147,26,0.35)]"
                    : "border-white/10 hover:border-white/20"
                )}>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", active ? "bg-[#F7931A]/20" : "bg-white/5")}>
                  <Icon className={cn("h-4 w-4", active ? "text-[#F7931A]" : "text-[#94A3B8]")} />
                </div>
                <div>
                  <p className={cn("font-body font-semibold text-xs", active ? "text-[#F7931A]" : "text-white")}>{label}</p>
                  <p className="font-body text-[10px] text-[#64748B] mt-0.5 leading-relaxed">{description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Global error */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 mb-5">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-body text-sm text-red-300">{error}</p>
            {error.includes("already exists") && (
              <Link href="/login" className="font-body text-xs text-[#F7931A] hover:underline mt-1 inline-block">Go to sign in →</Link>
            )}
          </div>
        </div>
      )}

      {/* Google */}
      <button onClick={handleGoogleSignup} disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-white/12 bg-white/5 text-white text-sm font-body font-medium hover:bg-white/10 hover:border-white/20 transition-all duration-200 mb-4 disabled:opacity-50">
        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        Sign up with Google as {role === "student" ? "Student" : "Recruiter"}
      </button>

      <div className="relative flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-white/8" />
        <span className="font-data text-[10px] tracking-widest uppercase text-[#94A3B8]">or with email</span>
        <div className="flex-1 h-px bg-white/8" />
      </div>

      <form onSubmit={handleSignup} noValidate className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8]">Full Name</label>
          <input
            placeholder="Jane Smith"
            value={fullName}
            onChange={(e) => { setFullName(e.target.value); clearFieldError("fullName") }}
            autoComplete="name"
            className={`${inputBase} ${fieldErrors.fullName ? "border-red-500/60" : "border-white/10 focus:border-[#F7931A]/60 focus:shadow-[0_0_15px_-5px_rgba(247,147,26,0.3)]"}`}
          />
          {fieldErrors.fullName && <p className="flex items-center gap-1.5 text-xs text-red-400 font-body"><AlertCircle className="h-3 w-3 shrink-0" />{fieldErrors.fullName}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8]">Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearFieldError("email") }}
            autoComplete="email"
            className={`${inputBase} ${fieldErrors.email ? "border-red-500/60" : "border-white/10 focus:border-[#F7931A]/60 focus:shadow-[0_0_15px_-5px_rgba(247,147,26,0.3)]"}`}
          />
          {fieldErrors.email && <p className="flex items-center gap-1.5 text-xs text-red-400 font-body"><AlertCircle className="h-3 w-3 shrink-0" />{fieldErrors.email}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8]">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearFieldError("password") }}
              autoComplete="new-password"
              className={`${inputBase} pr-11 ${fieldErrors.password ? "border-red-500/60" : "border-white/10 focus:border-[#F7931A]/60 focus:shadow-[0_0_15px_-5px_rgba(247,147,26,0.3)]"}`}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white transition-colors p-1">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* Strength meter */}
          {password.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-300", i <= strength.score ? strength.color : "bg-white/10")} />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="font-data text-[10px] text-[#94A3B8]">
                  {strength.score < 3 && "Use uppercase, numbers & symbols to strengthen"}
                  {strength.score >= 3 && <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-400" /> {strength.label} password</span>}
                </p>
              </div>
            </div>
          )}
          {fieldErrors.password && <p className="flex items-center gap-1.5 text-xs text-red-400 font-body"><AlertCircle className="h-3 w-3 shrink-0" />{fieldErrors.password}</p>}
        </div>

        {/* Recruiter notice */}
        {role === "recruiter" && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-white/4 border border-white/8">
            <Info className="h-3.5 w-3.5 text-[#94A3B8] shrink-0 mt-0.5" />
            <p className="font-body text-[11px] text-[#94A3B8] leading-relaxed">
              Recruiter accounts require admin approval before posting jobs. You&apos;ll receive an email once approved.
            </p>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-[#EA580C] to-[#F7931A] text-white font-body font-semibold text-sm shadow-[0_0_20px_-5px_rgba(234,88,12,0.5)] hover:shadow-[0_0_30px_-5px_rgba(247,147,26,0.7)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</> : "Create Account"}
        </button>
      </form>

      <p className="font-body text-center text-sm text-[#94A3B8] mt-5">
        Already have an account?{" "}
        <Link href="/login" className="text-[#F7931A] hover:text-[#FFD600] font-medium transition-colors">Sign in</Link>
      </p>

      <p className="font-body text-center text-[10px] text-[#4A5568] mt-4">
        By creating an account you agree to our{" "}
        <a href="#" className="hover:text-[#94A3B8] transition-colors underline">Terms</a>{" "}
        and{" "}
        <a href="#" className="hover:text-[#94A3B8] transition-colors underline">Privacy Policy</a>
      </p>
    </div>
  )
}
