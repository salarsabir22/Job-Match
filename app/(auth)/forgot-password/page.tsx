"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Zap, AlertCircle, Mail, ArrowLeft, CheckCircle2, RefreshCw } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const validate = () => {
    if (!email.trim()) { setError("Please enter your email address"); return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address"); return false }
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

  const inputBase =
    "w-full h-11 px-4 rounded-xl bg-[#030304] border text-white text-sm placeholder:text-white/25 focus:outline-none transition-all duration-200"

  /* ── Success state ── */
  if (sent) {
    return (
      <div className="bg-[#0F1115] border border-white/8 rounded-2xl p-8 shadow-[0_0_50px_-10px_rgba(255,255,255,0.1)]">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#FAFAFA]/12 border border-[#FAFAFA]/25 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-[#FAFAFA]" />
          </div>
          <h2 className="font-heading font-bold text-xl text-white mb-2">Check your inbox</h2>
          <p className="font-body text-[#94A3B8] text-sm">
            We sent a password reset link to
          </p>
          <p className="font-body text-white font-semibold text-sm mt-1">{email}</p>
        </div>

        {/* Steps */}
        <div className="bg-[#030304] border border-white/6 rounded-xl p-4 mb-5 space-y-3">
          {[
            { n: "1", text: "Open the email from JobMatch" },
            { n: "2", text: "Click \"Reset your password\"" },
            { n: "3", text: "Choose a new password on the next page" },
          ].map(({ n, text }) => (
            <div key={n} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#FAFAFA]/15 border border-[#FAFAFA]/30 flex items-center justify-center shrink-0">
                <span className="font-data text-[10px] font-bold text-[#FAFAFA]">{n}</span>
              </div>
              <p className="font-body text-sm text-[#94A3B8]">{text}</p>
            </div>
          ))}
        </div>

        {/* Spam notice */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white/3 border border-white/6 mb-5">
          <AlertCircle className="h-4 w-4 text-[#64748B] shrink-0 mt-0.5" />
          <p className="font-body text-xs text-[#64748B]">
            The link expires in <span className="text-[#94A3B8] font-medium">1 hour</span>. If you don&apos;t see the email, check your spam or junk folder.
          </p>
        </div>

        {/* Resend */}
        <button
          onClick={() => sendReset(true)}
          disabled={resending || resent}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-white/10 text-[#94A3B8] font-body text-sm hover:border-white/20 hover:text-white transition-all duration-200 disabled:opacity-50 mb-4"
        >
          {resending
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
            : resent
              ? <><CheckCircle2 className="h-4 w-4 text-neutral-400" /> <span className="text-neutral-400">Email resent!</span></>
              : <><RefreshCw className="h-4 w-4" /> Resend reset email</>
          }
        </button>

        <div className="text-center">
          <Link href="/login" className="inline-flex items-center gap-1.5 font-body text-sm text-[#64748B] hover:text-[#94A3B8] transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  /* ── Form state ── */
  return (
    <div className="bg-[#0F1115] border border-white/8 rounded-2xl p-8 shadow-[0_0_50px_-10px_rgba(255,255,255,0.1)]">
      {/* Header */}
      <div className="text-center mb-7">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#525252] to-[#FAFAFA] flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_-5px_rgba(255,255,255,0.6)]">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-heading font-bold text-2xl text-white">Reset your password</h1>
        <p className="font-body text-[#94A3B8] text-sm mt-1.5">
          Enter your email and we&apos;ll send you a secure reset link
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-neutral-500/25 mb-5">
          <AlertCircle className="h-4 w-4 text-neutral-500 shrink-0 mt-0.5" />
          <p className="font-body text-sm text-neutral-400">{error}</p>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); sendReset() }} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <label className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8]">
            Email address
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null) }}
            autoComplete="email"
            autoFocus
            className={`${inputBase} border-white/10 focus:border-[#FAFAFA]/60 focus:shadow-[0_0_15px_-5px_rgba(255,255,255,0.3)] ${error ? "border-neutral-500/50" : ""}`}
          />
          <p className="font-body text-[11px] text-[#4A5568]">
            We&apos;ll only send email to accounts that exist
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-[#525252] to-[#FAFAFA] text-white font-body font-semibold text-sm shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.7)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending link…</>
            : <><Mail className="h-4 w-4" /> Send Reset Link</>
          }
        </button>
      </form>

      <div className="text-center mt-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-body text-sm text-[#64748B] hover:text-[#94A3B8] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
