"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Zap, AlertCircle, Eye, EyeOff, CheckCircle2, ShieldCheck, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

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

const REQUIREMENTS = [
  { label: "At least 8 characters", check: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", check: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", check: (p: string) => /[0-9]/.test(p) },
]

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState(false)

  const strength = getPasswordStrength(password)

  /* Verify the recovery session is valid when the page loads */
  useEffect(() => {
    const supabase = createClient()
    const check = async () => {
      await new Promise(r => setTimeout(r, 600))
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session) { setSessionError(true); return }
      setSessionReady(true)
    }
    check()
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) { setError("Password must be at least 8 characters"); return }
    if (password !== confirm) { setError("Passwords don't match — please try again"); return }
    if (strength.score < 2) { setError("Choose a stronger password"); return }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setLoading(false)
      if (error.message.includes("same password")) {
        setError("Your new password must be different from your current password")
      } else {
        setError(error.message)
      }
      return
    }

    setDone(true)
    setTimeout(() => { window.location.href = "/login" }, 3000)
  }

  const inputBase =
    "w-full h-11 px-4 rounded-xl bg-white border text-black text-sm placeholder:text-black/25 focus:outline-none transition-all duration-200"

  /* ── Loading session check ── */
  if (!sessionReady && !sessionError) {
    return (
      <div className="bg-white border border-black/10 rounded-2xl p-8 text-center shadow-[0_0_50px_-10px_rgba(255,255,255,0.1)]">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-900 mx-auto mb-3" />
        <p className="font-body text-sm text-neutral-700">Verifying your reset link…</p>
      </div>
    )
  }

  /* ── Invalid / expired link ── */
  if (sessionError) {
    return (
      <div className="bg-white border border-black/10 rounded-2xl p-8 text-center shadow-[0_0_50px_-10px_rgba(255,255,255,0.1)]">
        <div className="w-14 h-14 rounded-2xl bg-red-500/12 border border-neutral-500/25 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-7 w-7 text-neutral-500" />
        </div>
        <h2 className="font-heading font-bold text-xl text-black mb-2">Link expired or invalid</h2>
        <p className="font-body text-neutral-700 text-sm mb-2">
          This password reset link has expired or already been used. Links are valid for <span className="text-black font-medium">1 hour</span>.
        </p>
        <p className="font-body text-xs text-[#64748B] mb-6">Request a new link and use it right away.</p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-black text-white font-body font-semibold text-sm shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.7)] transition-all duration-300 mb-3"
        >
          Request a new link
        </Link>
        <Link href="/login" className="inline-flex items-center gap-1.5 font-body text-sm text-[#64748B] hover:text-neutral-700 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </div>
    )
  }

  /* ── Success ── */
  if (done) {
    return (
      <div className="bg-white border border-black/10 rounded-2xl p-8 text-center shadow-[0_0_50px_-10px_rgba(255,255,255,0.1)]">
        <div className="w-16 h-16 rounded-2xl bg-neutral-500/12 border border-neutral-500/25 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="h-8 w-8 text-neutral-400" />
        </div>
        <h2 className="font-heading font-bold text-xl text-black mb-2">Password updated!</h2>
        <p className="font-body text-neutral-700 text-sm mb-1">Your password has been changed successfully.</p>
        <p className="font-body text-xs text-[#64748B] mb-6">Redirecting you to sign in…</p>
        <div className="flex items-center justify-center gap-2 text-neutral-700">
          <Loader2 className="h-4 w-4 animate-spin text-neutral-900" />
          <span className="font-body text-sm">Taking you to login</span>
        </div>
      </div>
    )
  }

  /* ── Form ── */
  return (
    <div className="bg-white border border-black/10 rounded-2xl p-8 shadow-[0_0_50px_-10px_rgba(255,255,255,0.1)]">
      {/* Header */}
      <div className="text-center mb-7">
        <div className="w-14 h-14 rounded-2xl bg-neutral-200 flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_-5px_rgba(255,255,255,0.6)]">
          <Zap className="w-7 h-7 text-black" />
        </div>
        <h1 className="font-heading font-bold text-2xl text-black">Choose a new password</h1>
        <p className="font-body text-neutral-700 text-sm mt-1.5">
          Make it strong — you won&apos;t be able to reuse your old one
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-neutral-500/25 mb-5">
          <AlertCircle className="h-4 w-4 text-neutral-500 shrink-0 mt-0.5" />
          <p className="font-body text-sm text-neutral-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleReset} noValidate className="space-y-4">
        {/* New password */}
        <div className="space-y-1.5">
          <label className="font-data text-[11px] tracking-wider uppercase text-neutral-700">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null) }}
              autoComplete="new-password"
              autoFocus
              className={`${inputBase} pr-11 border-black/10 focus:border-[#FAFAFA]/60 focus:shadow-[0_0_15px_-5px_rgba(255,255,255,0.3)]`}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-black transition-colors p-1">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Strength meter */}
          {password.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-300",
                    i <= strength.score ? strength.color : "bg-white/8")} />
                ))}
              </div>
              {strength.label && (
                <p className="font-data text-[10px] text-[#64748B]">
                  Strength: <span className={cn(
                    strength.score <= 1 ? "text-neutral-500" :
                    strength.score === 2 ? "text-neutral-400" :
                    strength.score === 3 ? "text-neutral-400" : "text-neutral-400"
                  )}>{strength.label}</span>
                </p>
              )}
            </div>
          )}

          {/* Requirements checklist */}
          <div className="space-y-1 pt-1">
            {REQUIREMENTS.map(({ label, check }) => {
              const ok = check(password)
              return (
                <div key={label} className="flex items-center gap-2">
                  <CheckCircle2 className={cn("h-3 w-3 shrink-0 transition-colors", ok ? "text-neutral-400" : "text-black/15")} />
                  <span className={cn("font-body text-[11px] transition-colors", ok ? "text-[#64748B]" : "text-black/20")}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label className="font-data text-[11px] tracking-wider uppercase text-neutral-700">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(null) }}
              autoComplete="new-password"
              className={cn(
                `${inputBase} pr-11`,
                confirm.length > 0
                  ? confirm === password
                    ? "border-neutral-500/50 focus:border-neutral-500/70"
                    : "border-neutral-500/50 focus:border-neutral-500/70"
                  : "border-black/10 focus:border-[#FAFAFA]/60 focus:shadow-[0_0_15px_-5px_rgba(255,255,255,0.3)]"
              )}
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-black transition-colors p-1">
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirm.length > 0 && (
            <p className={cn("flex items-center gap-1.5 font-body text-[11px]",
              confirm === password ? "text-neutral-400" : "text-neutral-500")}>
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              {confirm === password ? "Passwords match" : "Passwords don't match yet"}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || password !== confirm || password.length < 8}
          className="w-full h-11 rounded-xl bg-black text-white font-body font-semibold text-sm shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.7)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating password…</>
            : <><ShieldCheck className="h-4 w-4" /> Set New Password</>
          }
        </button>
      </form>

      <div className="text-center mt-5">
        <Link href="/login" className="inline-flex items-center gap-1.5 font-body text-sm text-[#64748B] hover:text-neutral-700 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
