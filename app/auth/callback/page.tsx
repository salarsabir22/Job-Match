"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const [status, setStatus] = useState("Completing sign in…")

  useEffect(() => {
    const supabase = createClient()

    const handleCallback = async () => {
      // Give Supabase time to parse the URL hash and set the session
      await new Promise((r) => setTimeout(r, 600))

      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        console.error("[callback] no session:", error)
        setStatus("Something went wrong. Redirecting…")
        setTimeout(() => { window.location.href = "/login?error=auth_callback_error" }, 1500)
        return
      }

      // ── Password recovery flow ──────────────────────────────────────────
      // Supabase sets session.user.aud = "authenticated" but we can detect
      // recovery by checking the URL search params we passed in redirectTo
      // OR by checking the raw URL hash for type=recovery.
      const hash = window.location.hash
      const isRecovery =
        hash.includes("type=recovery") ||
        new URLSearchParams(window.location.search).get("next") === "reset-password"

      if (isRecovery) {
        setStatus("Verified! Redirecting to password reset…")
        window.location.href = "/reset-password"
        return
      }

      // ── Normal OAuth / magic link flow ──────────────────────────────────
      const user = session.user
      setStatus("Loading your profile…")

      const pendingRole = localStorage.getItem("pending_role")
      if (pendingRole && (pendingRole === "student" || pendingRole === "recruiter")) {
        await supabase.from("profiles").update({ role: pendingRole }).eq("id", user.id)
        localStorage.removeItem("pending_role")
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      const role = pendingRole || profile?.role

      if (!profile) {
        window.location.href = "/onboarding"
      } else if (role === "recruiter") {
        const { data: rp } = await supabase.from("recruiter_profiles").select("id").eq("id", user.id).maybeSingle()
        window.location.href = rp ? "/jobs" : "/onboarding"
      } else if (role === "student") {
        const { data: sp } = await supabase.from("student_profiles").select("id").eq("id", user.id).maybeSingle()
        window.location.href = sp ? "/discover" : "/onboarding"
      } else if (role === "admin") {
        window.location.href = "/admin/users"
      } else {
        window.location.href = "/onboarding"
      }
    }

    handleCallback()
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-[#FAFAFA]" />
      <p className="text-neutral-700 font-body text-sm">{status}</p>
    </div>
  )
}
