import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { DashboardAccordionSection } from "@/components/dashboard/DashboardAccordionSection"
import { StudentDashboardCharts } from "@/components/dashboard/StudentDashboardCharts"
import { formatDate } from "@/lib/utils"
import { daysLastN, shortDayLabel } from "@/lib/dashboard/time-series"
import { dashTable } from "@/components/dashboard/dashboard-table-styles"

type SavedJobRow = {
  id: string
  created_at: string
  jobs: {
    id: string
    title: string
    job_type: string | null
    recruiter_profiles: { company_name: string | null }[] | null
  }[] | null
}

type MatchRow = {
  id: string
  created_at: string
  profiles: { full_name: string | null }[] | null
}

type SwipeTimelineRow = { created_at: string; direction: string }
type MatchTimelineRow = { created_at: string }

export async function StudentDashboardView({ userId, fullName }: { userId: string; fullName: string | null }) {
  const supabase = await createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30)
  const since = thirtyDaysAgo.toISOString()

  const [appliedRes, savedRes, matchesRes, savedJobsRes, recentMatchesRes, swipesTimelineRes, matchesTimelineRes] =
    await Promise.all([
      supabase.from("job_swipes").select("id", { count: "exact", head: true }).eq("student_id", userId).eq("direction", "right"),
      supabase.from("job_swipes").select("id", { count: "exact", head: true }).eq("student_id", userId).eq("direction", "saved"),
      supabase.from("matches").select("id", { count: "exact", head: true }).eq("student_id", userId),
      supabase
        .from("job_swipes")
        .select("id, created_at, jobs(id, title, job_type, recruiter_profiles(company_name))")
        .eq("student_id", userId)
        .eq("direction", "saved")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("matches")
        .select("id, created_at, profiles!matches_recruiter_id_fkey(full_name)")
        .eq("student_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("job_swipes").select("created_at, direction").eq("student_id", userId).gte("created_at", since),
      supabase.from("matches").select("created_at").eq("student_id", userId).gte("created_at", since),
    ])

  const applied = appliedRes.count || 0
  const saved = savedRes.count || 0
  const matches = matchesRes.count || 0
  const savedJobs = (savedJobsRes.data || []) as SavedJobRow[]
  const recentMatches = (recentMatchesRes.data || []) as MatchRow[]

  const days = daysLastN(30)
  const swipes = (swipesTimelineRes.data || []) as SwipeTimelineRow[]
  const matchTimeline = (matchesTimelineRes.data || []) as MatchTimelineRow[]

  const activity = days.map((day) => {
    let a = 0
    let s = 0
    for (const row of swipes) {
      if (row.created_at?.slice(0, 10) !== day) continue
      if (row.direction === "right") a++
      else if (row.direction === "saved") s++
    }
    return { label: shortDayLabel(day), applied: a, saved: s }
  })

  const matchesSeries = days.map((day) => ({
    label: shortDayLabel(day),
    matches: matchTimeline.filter((m) => m.created_at?.slice(0, 10) === day).length,
  }))

  const momentum = Math.min(100, applied * 5 + matches * 10)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="font-data text-[10px] tracking-[0.2em] uppercase text-neutral-700">Student Dashboard</p>
          <h1 className="font-heading text-3xl font-bold text-black mt-1">
            Welcome back{fullName ? `, ${fullName.split(" ")[0]}` : ""}
          </h1>
        </div>
        <Link
          href="/discover"
          className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-black text-white text-xs font-semibold shadow-[0_0_16px_-6px_rgba(0,0,0,0.4)] w-fit"
        >
          Discover jobs
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Applications", value: String(applied) },
          { label: "Saved jobs", value: String(saved) },
          { label: "Matches", value: String(matches) },
          { label: "Momentum", value: `${momentum}%` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-black/10 bg-white p-4">
            <p className="font-data text-[9px] tracking-wider uppercase text-neutral-700">{label}</p>
            <p className="font-heading text-2xl font-bold text-black mt-2">{value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="font-data text-[10px] tracking-widest uppercase text-neutral-700 mb-1">Last 30 days</p>
        <p className="font-body text-sm text-neutral-600">Activity from your swipes and new matches.</p>
        <StudentDashboardCharts activity={activity} matchesSeries={matchesSeries} />
      </div>

      <div className="space-y-3">
        <DashboardAccordionSection
          title="Saved jobs"
          subtitle="Recently bookmarked"
          badge={`${savedJobs.length} items`}
          defaultOpen
        >
          {savedJobs.length === 0 ? (
            <p className={dashTable.empty}>No saved jobs yet.</p>
          ) : (
            <div className={dashTable.wrap}>
              <table className={dashTable.table}>
                <thead>
                  <tr>
                    <th className={dashTable.th}>Job</th>
                    <th className={dashTable.th}>Company</th>
                    <th className={dashTable.th}>Type</th>
                    <th className={dashTable.th}>Saved</th>
                    <th className={`${dashTable.th} text-right`}> </th>
                  </tr>
                </thead>
                <tbody>
                  {savedJobs.map((row) => {
                    const job = row.jobs?.[0]
                    const companyName = job?.recruiter_profiles?.[0]?.company_name || "—"
                    const href = job?.id ? `/jobs/${job.id}` : "/saved"
                    return (
                      <tr key={row.id} className="hover:bg-black/[0.02]">
                        <td className={dashTable.td}>
                          <span className="font-medium">{job?.title || "Untitled"}</span>
                        </td>
                        <td className={dashTable.tdMuted}>{companyName}</td>
                        <td className={dashTable.tdMuted}>{job?.job_type?.replace(/_/g, " ") || "—"}</td>
                        <td className={dashTable.tdMuted}>{formatDate(row.created_at)}</td>
                        <td className={`${dashTable.td} text-right`}>
                          <Link href={href} className={dashTable.link}>
                            Open
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </DashboardAccordionSection>

        <DashboardAccordionSection title="Matches" subtitle="Recruiter connections" badge={`${matches} total`}>
          {recentMatches.length === 0 ? (
            <p className={dashTable.empty}>No matches yet. Keep swiping.</p>
          ) : (
            <div className={dashTable.wrap}>
              <table className={dashTable.table}>
                <thead>
                  <tr>
                    <th className={dashTable.th}>Recruiter</th>
                    <th className={dashTable.th}>Matched</th>
                    <th className={`${dashTable.th} text-right`}> </th>
                  </tr>
                </thead>
                <tbody>
                  {recentMatches.map((m) => (
                    <tr key={m.id} className="hover:bg-black/[0.02]">
                      <td className={dashTable.td}>
                        <span className="font-medium">{m.profiles?.[0]?.full_name || "Recruiter"}</span>
                      </td>
                      <td className={dashTable.tdMuted}>{formatDate(m.created_at)}</td>
                      <td className={`${dashTable.td} text-right`}>
                        <Link href="/matches" className={dashTable.link}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardAccordionSection>
      </div>
    </div>
  )
}
