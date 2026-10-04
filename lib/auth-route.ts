import { supabase } from "@/lib/supabase"
import { isRecruiterOnboardingComplete, isStudentOnboardingComplete } from "@/lib/completeness"
import { authRedirect } from "@/lib/oauth"

export const resetRedirect = authRedirect

export async function routeAfterLogin(userId: string) {
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
  if (profile?.role === "admin") return "/admin" as const
  if (profile?.role === "student") {
    const { data } = await supabase
      .from("student_profiles")
      .select(
        "university, degree, graduation_year, skills, preferred_job_categories, linkedin_url, github_url, portfolio_url, resume_url"
      )
      .eq("id", userId)
      .maybeSingle()
    return isStudentOnboardingComplete(data) ? ("/discover" as const) : ("/onboarding" as const)
  }
  if (profile?.role === "recruiter") {
    const { data } = await supabase
      .from("recruiter_profiles")
      .select("company_name, description, hiring_focus")
      .eq("id", userId)
      .maybeSingle()
    return isRecruiterOnboardingComplete(data) ? ("/discover" as const) : ("/onboarding" as const)
  }
  return "/onboarding" as const
}
