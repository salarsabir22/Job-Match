import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StudentMatchesView } from "./StudentMatchesView"

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role === "recruiter") redirect("/jobs?tab=pipeline")
  return <StudentMatchesView userId={user.id} />
}
