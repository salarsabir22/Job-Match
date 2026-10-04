"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { isAllowedReturn } from "@/lib/auth-sites"

let started = false

export default function GoogleStartPage() {
  useEffect(() => {
    if (started) return
    started = true

    const params = new URLSearchParams(window.location.search)
    const returnTo = params.get("returnTo")
    const role = params.get("role")
    const next = params.get("next")
    if (returnTo && isAllowedReturn(returnTo)) sessionStorage.setItem("swypejobs.returnTo", returnTo)
    else sessionStorage.removeItem("swypejobs.returnTo")
    if (role === "student" || role === "recruiter") sessionStorage.setItem("swypejobs.returnRole", role)
    else sessionStorage.removeItem("swypejobs.returnRole")
    if (next) sessionStorage.setItem("swypejobs.returnNext", next)
    else sessionStorage.removeItem("swypejobs.returnNext")
    const redirectTo = new URL("/auth/callback", window.location.origin)

    const supabase = createClient()
    void supabase.auth
      .signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectTo.toString() },
      })
      .then(({ error }) => {
        if (error) {
          window.location.replace(`/login?error=${encodeURIComponent(error.message)}`)
        }
      })
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <p className="text-sm text-muted-foreground">Continuing to Google…</p>
    </main>
  )
}
