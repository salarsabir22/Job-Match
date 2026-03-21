"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Eye, EyeOff } from "lucide-react"
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
    "w-full min-h-[3.25rem] px-5 rounded-full border border-white/[0.15] bg-white/[0.07] text-[15px] text-white placeholder:text-white/30 backdrop-blur-sm focus:outline-none focus:border-white/35 focus:ring-2 focus:ring-white/[0.08] transition-all duration-300"

  if (!sessionReady && !sessionError) {
    return (
      <div className="rounded-2xl border border-white/[0.12] bg-white/[0.06] px-6 py-10 text-center backdrop-blur-sm">
        <Loader2 className="h-8 w-8 animate-spin text-white/60 mx-auto mb-3" />
        <p className="font-body text-sm text-white/45">Verifying your reset link…</p>
      </div>
    )
  }

  if (sessionError) {
    return (
      <div className="rounded-2xl border border-white/[0.12] bg-white/[0.06] px-6 py-8 sm:px-8 text-center backdrop-blur-sm">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/35">Reset link</p>
        <h2 className="mt-4 text-[18px] font-semibold tracking-[-0.03em] text-white mb-2">Link expired or invalid</h2>
        <p className="font-body text-white/45 text-sm mb-2">
          Reset links last <span className="text-white/70 font-medium">1 hour</span> and work once.
        </p>
        <p className="font-body text-xs text-white/35 mb-6">Request a fresh link below.</p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center gap-2 w-full min-h-[3.25rem] rounded-full bg-white text-black font-semibold text-[15px] hover:bg-white/90 transition-all duration-300 mb-3"
        >
          Request a new link
        </Link>
        <Link href="/login" className="font-body text-sm text-white/42 hover:text-white/70 transition-colors">
          ← Back to sign in
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-white/[0.12] bg-white/[0.06] px-6 py-8 text-center backdrop-blur-sm">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/35">Complete</p>
        <h2 className="mt-4 text-[18px] font-semibold tracking-[-0.03em] text-white mb-2">Password updated</h2>
        <p className="font-body text-white/45 text-sm mb-1">You&apos;re all set.</p>
        <p className="font-body text-xs text-white/35 mb-6">Redirecting to sign in…</p>
        <div className="flex items-center justify-center gap-2 text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-body text-sm">Loading login</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/[0.12] bg-white/[0.06] px-6 py-8 sm:px-8 sm:py-10 backdrop-blur-sm">
      <div className="text-center mb-7">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/35">Security</p>
        <h1 className="mt-3 text-[20px] sm:text-[21px] font-semibold tracking-[-0.03em] text-white">New password</h1>
        <p className="font-body text-white/42 text-[15px] mt-2">Choose something strong you haven&apos;t used before</p>
      </div>

      {error && (
        <div className="border-l-2 border-red-400/50 bg-red-500/[0.08] pl-4 pr-3 py-3 rounded-r-xl mb-5">
          <p className="font-body text-[14px] leading-snug text-red-100/90">{error}</p>
        </div>
      )}

      <form onSubmit={handleReset} noValidate className="space-y-4">
        {/* New password */}
        <div className="space-y-1.5">
          <label className="font-data text-[11px] tracking-[0.2em] uppercase text-white/38">New password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(null)
              }}
              autoComplete="new-password"
              autoFocus
              className={`${inputBase} pr-11`}
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
            <div className="space-y-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-all duration-300",
                      i <= strength.score ? strength.color : "bg-white/10"
                    )}
                  />
                ))}
              </div>
              {strength.label && (
                <p className="font-data text-[10px] text-white/40">
                  Strength: <span className="text-white/60">{strength.label}</span>
                </p>
              )}
            </div>
          )}

          <div className="space-y-1 pt-1">
            {REQUIREMENTS.map(({ label, check }) => {
              const ok = check(password)
              return (
                <div key={label} className="flex items-center gap-2">
                  <CheckCircle2
                    className={cn("h-3 w-3 shrink-0 transition-colors", ok ? "text-emerald-400/90" : "text-white/15")}
                  />
                  <span
                    className={cn(
                      "font-body text-[11px] transition-colors",
                      ok ? "text-white/50" : "text-white/25"
                    )}
                  >
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-data text-[11px] tracking-[0.2em] uppercase text-white/38">Confirm password</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value)
                setError(null)
              }}
              autoComplete="new-password"
              className={cn(`${inputBase} pr-11`, confirm.length > 0 && confirm !== password ? "border-red-400/40" : "")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors p-1"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirm.length > 0 && (
            <p
              className={cn(
                "font-body text-[11px]",
                confirm === password ? "text-emerald-300/90" : "text-red-300/80"
              )}
            >
              {confirm === password ? "Passwords match" : "Doesn't match yet"}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || password !== confirm || password.length < 8}
          className="w-full min-h-[3.25rem] rounded-full bg-white text-black font-semibold text-[15px] hover:bg-white/90 transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Updating…
            </>
          ) : (
            "Set password"
          )}
        </button>
      </form>

      <div className="text-center mt-5">
        <Link href="/login" className="font-body text-sm text-white/42 hover:text-white/70 transition-colors">
          ← Back to sign in
        </Link>
      </div>
    </div>
  )
}
