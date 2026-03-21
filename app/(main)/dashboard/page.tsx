import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StudentDashboardView } from "./student-dashboard-view"
import { RecruiterDashboardView } from "./recruiter-dashboard-view"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/onboarding")

  if (profile.role === "recruiter") {
    return <RecruiterDashboardView userId={user.id} fullName={profile.full_name} />
  }

  return <StudentDashboardView userId={user.id} fullName={profile.full_name} />
}

