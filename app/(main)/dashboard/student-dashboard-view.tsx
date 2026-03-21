import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Calendar, Heart, Bookmark, Sparkles, ArrowRight, Briefcase } from "lucide-react"
import { DashboardAccordionSection } from "@/components/dashboard/DashboardAccordionSection"
import { formatDate } from "@/lib/utils"

type SavedJobRow = {
  id: string
  created_at: string
  jobs: {
    id: string
    title: string
    job_type: string | null
    recruiter_profiles: { company_name: string | null } | null
  } | null
}

type MatchRow = {
  id: string
  created_at: string
  profiles: { full_name: string | null } | null
}

export async function StudentDashboardView({ userId, fullName }: { userId: string; fullName: string | null }) {
  const supabase = await createClient()

  const [appliedRes, savedRes, matchesRes, savedJobsRes, recentMatchesRes] = await Promise.all([
    supabase.from("job_swipes").select("id", { count: "exact", head: true }).eq("student_id", userId).eq("direction", "right"),
    supabase.from("job_swipes").select("id", { count: "exact", head: true }).eq("student_id", userId).eq("direction", "saved"),
    supabase.from("matches").select("id", { count: "exact", head: true }).eq("student_id", userId),
    supabase
      .from("job_swipes")
      .select("id, created_at, jobs(id, title, job_type, recruiter_profiles(company_name))")
      .eq("student_id", userId)
      .eq("direction", "saved")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("matches")
      .select("id, created_at, profiles!matches_recruiter_id_fkey(full_name)")
      .eq("student_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  const applied = appliedRes.count || 0
  const saved = savedRes.count || 0
  const matches = matchesRes.count || 0
  const savedJobs = (savedJobsRes.data || []) as SavedJobRow[]
  const recentMatches = (recentMatchesRes.data || []) as MatchRow[]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-data text-[10px] tracking-[0.2em] uppercase text-neutral-700">Student Dashboard</p>
          <h1 className="font-heading text-3xl font-bold text-black mt-1">
            Welcome back{fullName ? `, ${fullName.split(" ")[0]}` : ""}
          </h1>
        </div>
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-xs font-semibold shadow-[0_0_16px_-6px_rgba(0,0,0,0.4)]"
        >
          Discover Jobs <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Applications", value: applied, icon: Briefcase },
          { label: "Saved Jobs", value: saved, icon: Bookmark },
          { label: "Matches", value: matches, icon: Heart },
          { label: "Momentum", value: `${Math.min(100, applied * 5 + matches * 10)}%`, icon: Sparkles },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-black/10 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-data text-[9px] tracking-wider uppercase text-neutral-700">{label}</p>
              <Icon className="h-3.5 w-3.5 text-neutral-900" />
            </div>
            <p className="font-heading text-2xl font-bold text-black">{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <DashboardAccordionSection
          title="Application Activity"
          subtitle="Quick pulse on your current pipeline"
          badge={`${applied} sent`}
          defaultOpen
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
            <MetricTile label="Applied" value={applied} />
            <MetricTile label="Saved" value={saved} />
            <MetricTile label="Matched" value={matches} />
          </div>
        </DashboardAccordionSection>

        <DashboardAccordionSection
          title="Saved Jobs"
          subtitle="Recently bookmarked opportunities"
          badge={`${savedJobs.length} recent`}
          defaultOpen
        >
          <div className="mt-3 space-y-2">
            {savedJobs.length === 0 ? (
              <p className="font-body text-sm text-neutral-700">No saved jobs yet.</p>
            ) : (
              savedJobs.map((row) => (
                <Link
                  key={row.id}
                  href={row.jobs?.id ? `/jobs/${row.jobs.id}` : "/saved"}
                  className="block rounded-xl border border-black/10 p-3 hover:border-black/20 transition-colors"
                >
                  <p className="font-body text-sm font-semibold text-black">{row.jobs?.title || "Untitled job"}</p>
                  <p className="font-body text-xs text-neutral-700 mt-0.5">
                    {row.jobs?.recruiter_profiles?.company_name || "Company"} · {row.jobs?.job_type?.replace("_", " ") || "Role"}
                  </p>
                </Link>
              ))
            )}
          </div>
        </DashboardAccordionSection>

        <DashboardAccordionSection
          title="Recent Matches"
          subtitle="New recruiter connections"
          badge={`${matches} total`}
        >
          <div className="mt-3 space-y-2">
            {recentMatches.length === 0 ? (
              <p className="font-body text-sm text-neutral-700">No matches yet. Keep swiping.</p>
            ) : (
              recentMatches.map((m) => (
                <div key={m.id} className="rounded-xl border border-black/10 p-3">
                  <p className="font-body text-sm font-semibold text-black">{m.profiles?.full_name || "Recruiter"}</p>
                  <p className="font-data text-[10px] tracking-wider uppercase text-neutral-700 mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />Matched {formatDate(m.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </DashboardAccordionSection>
      </div>
    </div>
  )
}

function MetricTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-black/10 bg-black/[0.01] p-3">
      <p className="font-data text-[9px] tracking-wider uppercase text-neutral-700">{label}</p>
      <p className="font-heading text-xl font-bold text-black mt-1">{value}</p>
    </div>
  )
}

