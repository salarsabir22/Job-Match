import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { safeInternalPath } from "@/lib/utils"

function loginErrorRedirect(origin: string, message: string) {
  const url = new URL("/login", origin)
  url.searchParams.set("error", message)
  return NextResponse.redirect(url)
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next")
  const roleParam = searchParams.get("role")
  const oauthError =
    searchParams.get("error_description") ||
    searchParams.get("error")

  if (oauthError) {
    return loginErrorRedirect(origin, oauthError)
  }

  if (!code) {
    return loginErrorRedirect(origin, "Google sign-in did not complete. Try again.")
  }

  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    console.error("[auth/callback]", exchangeError.message)
    return loginErrorRedirect(
      origin,
      exchangeError.message || "Could not complete Google sign-in."
    )
  }

  if (next === "reset-password") {
    return NextResponse.redirect(new URL("/reset-password", origin))
  }

  const nextPath = safeInternalPath(next)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return loginErrorRedirect(origin, "Google sign-in did not complete. Try again.")
  }

  if (roleParam === "student" || roleParam === "recruiter") {
    await supabase.from("profiles").update({ role: roleParam }).eq("id", user.id)
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  const role = roleParam === "student" || roleParam === "recruiter" ? roleParam : profile?.role

  if (!profile) {
    return NextResponse.redirect(new URL("/onboarding", origin))
  }
  if (nextPath) {
    return NextResponse.redirect(new URL(nextPath, origin))
  }
  if (role === "recruiter") {
    const { data: rp } = await supabase
      .from("recruiter_profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle()
    return NextResponse.redirect(new URL(rp ? "/jobs" : "/onboarding", origin))
  }
  if (role === "student") {
    const { data: sp } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle()
    return NextResponse.redirect(new URL(sp ? "/discover" : "/onboarding", origin))
  }
  if (role === "admin") {
    return NextResponse.redirect(new URL("/admin/users", origin))
  }

  return NextResponse.redirect(new URL("/onboarding", origin))
}
