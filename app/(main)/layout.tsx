import { createClient } from "@/lib/supabase/server"
import { AppNav } from "@/components/nav/AppNav"
import { AppBottomNav } from "@/components/nav/AppBottomNav"
import { AppFooter } from "@/components/nav/AppFooter"
import { AppMain } from "@/components/nav/AppMain"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types"
import { isStudentOnboardingComplete, isRecruiterOnboardingComplete, STUDENT_ONBOARDING_SELECT, RECRUITER_ONBOARDING_SELECT } from "@/lib/profile/completeness"
import { redirect } from "next/navigation"

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role: UserRole | "admin" = "student"
  let fullName: string | null = null
  let avatarUrl: string | null = null
  let shareTitle: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name, avatar_url")
      .eq("id", user.id)
      .single()
    role = (profile?.role as UserRole | "admin") || "student"
    fullName = profile?.full_name ?? null
    avatarUrl = profile?.avatar_url ?? null
    shareTitle = fullName
    if (role === "recruiter") {
      const { data: company } = await supabase
        .from("recruiter_profiles")
        .select(RECRUITER_ONBOARDING_SELECT)
        .eq("id", user.id)
        .maybeSingle()
      if (company?.company_name) shareTitle = company.company_name
      if (!isRecruiterOnboardingComplete(company)) redirect("/onboarding")
    }
    if (role === "student") {
      const { data: student } = await supabase
        .from("student_profiles")
        .select(STUDENT_ONBOARDING_SELECT)
        .eq("id", user.id)
        .maybeSingle()
      if (!isStudentOnboardingComplete(student)) redirect("/onboarding")
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden apple-grouped-bg text-foreground selection:bg-primary/20">
      <AppNav
        role={role}
        userId={user?.id ?? null}
        fullName={fullName}
        email={user?.email ?? null}
        avatarUrl={avatarUrl}
        shareTitle={shareTitle}
      />

      <main className={cn("min-w-0 pt-16", user && role !== "admin" && "lg:pb-0")}>
        <AppMain>{children}</AppMain>
        {user ? <AppFooter role={role} /> : null}
      </main>
      {user ? <AppBottomNav role={role} /> : null}
    </div>
  )
}
