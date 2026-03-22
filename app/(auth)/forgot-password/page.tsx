"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Loader2, CheckCircle2, RefreshCw, ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const validate = () => {
    if (!email.trim()) {
      setError("Please enter your email address")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address")
      return false
    }
    return true
  }

  const sendReset = async (isResend = false) => {
    setError(null)
    if (!validate()) return
    if (isResend) setResending(true)
    else setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      setResending(false)
      return
    }

    if (isResend) {
      setResending(false)
      setResent(true)
      setTimeout(() => setResent(false), 4000)
    } else {
      setLoading(false)
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="auth-card">
        <div className="text-center mb-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Email sent</p>
          <h2 className="mt-4 text-[18px] font-semibold tracking-[-0.03em] text-foreground mb-2">Check your inbox</h2>
          <p className="font-body text-muted-foreground text-sm">We sent a reset link to</p>
          <p className="font-body text-foreground font-medium text-sm mt-1">{email}</p>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 p-4 mb-5 space-y-3">
          {[
            { n: "1", text: "Open the email from JobMatch" },
            { n: "2", text: "Click “Reset your password”" },
            { n: "3", text: "Choose a new password" },
          ].map(({ n, text }) => (
            <div key={n} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                <span className="font-data text-[10px] font-bold text-foreground">{n}</span>
              </div>
              <p className="font-body text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>

        <div className="border-l-2 border-primary/25 bg-muted/40 pl-3.5 py-2.5 rounded-r-lg mb-5">
          <p className="font-body text-[12px] leading-snug text-muted-foreground">
            Link expires in <span className="text-foreground font-medium">1 hour</span>. Check spam if needed.
          </p>
        </div>

        <button
          type="button"
          onClick={() => sendReset(true)}
          disabled={resending || resent}
          className="w-full min-h-[3.25rem] rounded-full border-2 border-primary text-primary font-body text-sm hover:bg-primary hover:text-primary-foreground transition-all duration-200 disabled:opacity-45 mb-4 flex items-center justify-center gap-2"
        >
          {resending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending…
            </>
          ) : resent ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-muted-foreground">Sent again</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" /> Resend email
            </>
          )}
        </button>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-card">
      <div className="text-center mb-7">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Password</p>
        <h1 className="mt-3 text-[20px] sm:text-[21px] font-semibold tracking-[-0.03em] text-foreground">Reset password</h1>
        <p className="font-body text-muted-foreground text-[15px] mt-2">We&apos;ll email you a secure link</p>
      </div>

      {error && (
        <div className="border-l-2 border-destructive/80 bg-destructive/10 pl-4 pr-3 py-3 rounded-r-xl mb-5">
          <p className="font-body text-[14px] leading-snug text-destructive">{error}</p>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void sendReset()
        }}
        noValidate
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <label className="font-data text-[11px] tracking-[0.2em] uppercase text-muted-foreground">Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(null)
            }}
            autoComplete="email"
            autoFocus
            className="auth-input"
          />
          <p className="font-body text-[11px] text-muted-foreground">Only sent if an account exists</p>
        </div>

        <button type="submit" disabled={loading} className="auth-btn-primary disabled:opacity-45">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending…
            </>
          ) : (
            "Send reset link"
          )}
        </button>
      </form>

      <div className="text-center mt-6">
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-1.5 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
