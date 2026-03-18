"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Zap, Mail } from "lucide-react"

export function WaitlistForm() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const v = email.trim().toLowerCase()
    if (!v) return setError("Email is required.")
    // Relaxed validation to prevent false negatives (pasted input, unicode whitespace, etc.)
    if (!v.includes("@") || !v.includes(".")) return setError("Enter a valid email.")

    setSubmitting(true)
    try {
      // Requires anon insert policy on waitlist_emails.
      const { error: upsertError } = await supabase
        .from("waitlist_emails")
        .upsert({ email: v }, { onConflict: "email" })

      if (upsertError) throw upsertError

      router.push("/waitlist?success=1")
    } catch (err: any) {
      setError(err?.message || "Failed to join waitlist.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030304] text-white flex items-center">
      <div className="w-full px-4 py-10 max-w-3xl mx-auto">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-sm shadow-[0_0_50px_-25px_rgba(247,147,26,0.5)] overflow-hidden">
          <div className="p-6 sm:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center shadow-[0_0_20px_-8px_rgba(247,147,26,0.8)]">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-3xl">Join the Waitlist</h1>
                <p className="font-body text-[#94A3B8] mt-1">
                  Get early access updates for JobMatch.
                </p>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="font-data text-[11px] tracking-widest uppercase text-[#94A3B8]">
                  Email
                </label>
                <div className="mt-2 relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder:text-[#94A3B8] outline-none focus:border-[#F7931A]/60"
                    type="email"
                    autoComplete="email"
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-sm font-body">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#EA580C] to-[#F7931A] text-white font-body font-semibold text-sm tracking-wide shadow-[0_0_20px_-5px_rgba(234,88,12,0.5)] hover:scale-[1.01] transition-all duration-200 disabled:opacity-60 disabled:hover:scale-100"
              >
                {submitting ? "Submitting..." : "Join waitlist"}
              </button>

              <p className="font-data text-[10px] text-[#94A3B8] leading-relaxed">
                By joining, you’ll receive a single confirmation and early access updates.
              </p>
            </form>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="font-data text-[10px] text-[#94A3B8] tracking-widest uppercase">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </div>
  )
}

