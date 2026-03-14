import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StudentDiscoverView } from "./StudentDiscoverView"
import { RecruiterDiscoverView } from "./RecruiterDiscoverView"

export default async function DiscoverPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/onboarding")

  if (profile.role === "recruiter") {
    return <RecruiterDiscoverView userId={user.id} />
  }

  return <StudentDiscoverView userId={user.id} />
}
