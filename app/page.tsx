import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { WaitlistForm } from "@/components/waitlist/WaitlistForm"
import { DASHBOARD_ORIGIN } from "@/lib/auth-sites"
import { createClient } from "@/lib/supabase/server"
import {
  isRecruiterOnboardingComplete,
  isStudentOnboardingComplete,
  postAuthRedirect,
  RECRUITER_ONBOARDING_SELECT,
  STUDENT_ONBOARDING_SELECT,
} from "@/lib/profile/completeness"

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  if (firstParam(params.code) || firstParam(params.error) || firstParam(params.error_description)) {
    const q = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      const v = firstParam(value)
      if (v) q.set(key, v)
    }
    const jar = await cookies()
    const hasVerifier = jar.getAll().some((cookie) => cookie.name.includes("code-verifier"))
    if (firstParam(params.code) && !hasVerifier) {
      q.set("from", "landing")
      redirect(`${DASHBOARD_ORIGIN}/auth/callback?${q.toString()}`)
    }
    redirect(`/auth/callback?${q.toString()}`)
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    let studentReady = false
    let recruiterReady = false
    if (profile?.role === "student") {
      const { data } = await supabase
        .from("student_profiles")
        .select(STUDENT_ONBOARDING_SELECT)
        .eq("id", user.id)
        .maybeSingle()
      studentReady = isStudentOnboardingComplete(data)
    }
    if (profile?.role === "recruiter") {
      const { data } = await supabase
        .from("recruiter_profiles")
        .select(RECRUITER_ONBOARDING_SELECT)
        .eq("id", user.id)
        .maybeSingle()
      recruiterReady = isRecruiterOnboardingComplete(data)
    }
    redirect(
      postAuthRedirect({
        role: profile?.role,
        studentReady,
        recruiterReady,
      })
    )
  }

  return <WaitlistForm />
}
