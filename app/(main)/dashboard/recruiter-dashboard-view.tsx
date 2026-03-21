import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { DashboardAccordionSection } from "@/components/dashboard/DashboardAccordionSection"
import { RecruiterDashboardCharts } from "@/components/dashboard/RecruiterDashboardCharts"
import { formatDate } from "@/lib/utils"
import { daysLastN, shortDayLabel } from "@/lib/dashboard/time-series"

type JobRow = {
  id: string
  title: string
  is_active: boolean
  created_at: string
}

type MatchRow = {
  id: string
  created_at: string
  profiles: { full_name: string | null }[] | null
}

type JobSwipeRow = { job_id: string }
type CreatedRow = { created_at: string }

export async function RecruiterDashboardView({ userId, fullName }: { userId: string; fullName: string | null }) {
  const supabase = await createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30)
  const since = thirtyDaysAgo.toISOString()

  const [jobsRes, matchesRes, shortlistedRes] = await Promise.all([
    supabase.from("jobs").select("id, title, is_active, created_at").eq("recruiter_id", userId).order("created_at", { ascending: false }),
    supabase.from("matches").select("id", { count: "exact", head: true }).eq("recruiter_id", userId),
    supabase.from("matches").select("id", { count: "exact", head: true }).eq("recruiter_id", userId).eq("is_shortlisted", true),
  ])

  const jobs = (jobsRes.data || []) as JobRow[]
  const jobIds = jobs.map((j) => j.id)

  const [applicationsRes, recentMatchesRes, appTimelineRes, matchTimelineRes] = await Promise.all([
    jobIds.length > 0
      ? supabase.from("job_swipes").select("job_id").in("job_id", jobIds).eq("direction", "right")
      : Promise.resolve({ data: [] as JobSwipeRow[] }),
    supabase
      .from("matches")
      .select("id, created_at, profiles!matches_student_id_fkey(full_name)")
      .eq("recruiter_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
    jobIds.length > 0
      ? supabase
          .from("job_swipes")
          .select("created_at")
          .in("job_id", jobIds)
          .eq("direction", "right")
          .gte("created_at", since)
      : Promise.resolve({ data: [] as CreatedRow[] }),
    supabase.from("matches").select("created_at").eq("recruiter_id", userId).gte("created_at", since),
  ])

  const matches = matchesRes.count || 0
  const shortlisted = shortlistedRes.count || 0
  const activeJobs = jobs.filter((j) => j.is_active).length
  const applications = (applicationsRes.data || []).length
  const recentMatches = (recentMatchesRes.data || []) as MatchRow[]

  const perJobApps = new Map<string, number>()
  for (const row of (applicationsRes.data || []) as JobSwipeRow[]) {
    perJobApps.set(row.job_id, (perJobApps.get(row.job_id) || 0) + 1)
  }

  const days = daysLastN(30)
  const appRows = (appTimelineRes.data || []) as CreatedRow[]
  const matchRows = (matchTimelineRes.data || []) as CreatedRow[]

  const timeline = days.map((day) => ({
    label: shortDayLabel(day),
    applications: appRows.filter((r) => r.created_at?.slice(0, 10) === day).length,
    matches: matchRows.filter((r) => r.created_at?.slice(0, 10) === day).length,
  }))

  const jobBars = [...jobs]
    .map((j) => ({ name: j.title.length > 24 ? `${j.title.slice(0, 24)}…` : j.title, applications: perJobApps.get(j.id) || 0 }))
    .filter((x) => x.applications > 0)
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="font-data text-[10px] tracking-[0.2em] uppercase text-neutral-700">Recruiter Dashboard</p>
          <h1 className="font-heading text-3xl font-bold text-black mt-1">
            Hiring cockpit{fullName ? ` · ${fullName.split(" ")[0]}` : ""}
          </h1>
        </div>
        <Link
          href="/jobs/new"
          className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-black text-white text-xs font-semibold shadow-[0_0_16px_-6px_rgba(0,0,0,0.4)] w-fit"
        >
          Post job
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active jobs", value: String(activeJobs) },
          { label: "Applications", value: String(applications) },
          { label: "Matches", value: String(matches) },
          { label: "Shortlisted", value: String(shortlisted) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-black/10 bg-white p-4">
            <p className="font-data text-[9px] tracking-wider uppercase text-neutral-700">{label}</p>
            <p className="font-heading text-2xl font-bold text-black mt-2">{value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="font-data text-[10px] tracking-widest uppercase text-neutral-700 mb-1">Last 30 days</p>
        <p className="font-body text-sm text-neutral-600">Application volume, matches, and top postings.</p>
        <RecruiterDashboardCharts timeline={timeline} jobBars={jobBars} />
      </div>

      <div className="space-y-3">
        <DashboardAccordionSection title="Job performance" subtitle="Per posting" badge={`${jobs.length} total`} defaultOpen>
          <div className="mt-3 space-y-2">
            {jobs.length === 0 ? (
              <p className="font-body text-sm text-neutral-700">No jobs yet. Post your first one to start the pipeline.</p>
            ) : (
              jobs.slice(0, 6).map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block rounded-xl border border-black/10 p-3 hover:border-black/20 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-body text-sm font-semibold text-black truncate">{job.title}</p>
                      <p className="font-data text-[10px] tracking-wider uppercase text-neutral-700 mt-1">
                        {job.is_active ? "Active" : "Paused"} · Posted {formatDate(job.created_at)}
                      </p>
                    </div>
                    <span className="font-heading text-lg font-bold text-black tabular-nums">{perJobApps.get(job.id) || 0}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </DashboardAccordionSection>

        <DashboardAccordionSection
          title="Recent candidate matches"
          subtitle="Follow up"
          badge={`${recentMatches.length} recent`}
          defaultOpen
        >
          <div className="mt-3 space-y-2">
            {recentMatches.length === 0 ? (
              <p className="font-body text-sm text-neutral-700">No matches yet. Improve job details to raise relevance.</p>
            ) : (
              recentMatches.map((m) => (
                <div key={m.id} className="rounded-xl border border-black/10 p-3">
                  <p className="font-body text-sm font-semibold text-black">{m.profiles?.[0]?.full_name || "Candidate"}</p>
                  <p className="font-data text-[10px] tracking-wider uppercase text-neutral-700 mt-1">
                    Matched {formatDate(m.created_at)}
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
