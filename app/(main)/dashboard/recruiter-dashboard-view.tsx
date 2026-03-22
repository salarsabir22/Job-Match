import Link from "next/link"
import { ArrowRight, Briefcase, Inbox, LayoutDashboard, Star, Users } from "lucide-react"
import { PageSymbol } from "@/components/ui/page-symbol"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import { DashboardPanel } from "@/components/dashboard/DashboardPanel"
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader"
import { DashboardKpiCard } from "@/components/dashboard/DashboardKpiCard"
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState"
import { RecruiterDashboardCharts } from "@/components/dashboard/RecruiterDashboardCharts"
import { formatDate } from "@/lib/utils"
import { daysLastN, shortDayLabel } from "@/lib/dashboard/time-series"
import { dashTable } from "@/components/dashboard/dashboard-table-styles"
import { weekOverWeekHint } from "@/lib/dashboard/period-metrics"
import { conversationChatHref } from "@/lib/dashboard/chat-links"
import { coalesceRelation } from "@/lib/dashboard/relations"

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
  jobs: { title: string | null }[] | null
  conversations: { id: string }[] | null
}

type JobSwipeRow = { job_id: string }
type CreatedRow = { created_at: string }

export async function RecruiterDashboardView({ userId, fullName }: { userId: string; fullName: string | null }) {
  const supabase = await createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30)
  const since = thirtyDaysAgo.toISOString()

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7)
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 14)
  const since7 = sevenDaysAgo.toISOString()
  const since14 = fourteenDaysAgo.toISOString()

  const [jobsRes, matchesRes, shortlistedRes] = await Promise.all([
    supabase.from("jobs").select("id, title, is_active, created_at").eq("recruiter_id", userId).order("created_at", { ascending: false }),
    supabase.from("matches").select("id", { count: "exact", head: true }).eq("recruiter_id", userId),
    supabase.from("matches").select("id", { count: "exact", head: true }).eq("recruiter_id", userId).eq("is_shortlisted", true),
  ])

  const jobs = (jobsRes.data || []) as JobRow[]
  const jobIds = jobs.map((j) => j.id)

  const [applicationsRes, recentMatchesRes, appTimelineRes, matchTimelineRes, inbLast7Res, inbPrev7Res] =
    await Promise.all([
      jobIds.length > 0
        ? supabase.from("job_swipes").select("job_id").in("job_id", jobIds).eq("direction", "right")
        : Promise.resolve({ data: [] as JobSwipeRow[] }),
      supabase
        .from("matches")
        .select("id, created_at, profiles!matches_student_id_fkey(full_name), jobs(title), conversations(id)")
        .eq("recruiter_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      jobIds.length > 0
        ? supabase
            .from("job_swipes")
            .select("created_at")
            .in("job_id", jobIds)
            .eq("direction", "right")
            .gte("created_at", since)
        : Promise.resolve({ data: [] as CreatedRow[] }),
      supabase.from("matches").select("created_at").eq("recruiter_id", userId).gte("created_at", since),
      jobIds.length > 0
        ? supabase
            .from("job_swipes")
            .select("id", { count: "exact", head: true })
            .in("job_id", jobIds)
            .eq("direction", "right")
            .gte("created_at", since7)
        : Promise.resolve({ count: 0 }),
      jobIds.length > 0
        ? supabase
            .from("job_swipes")
            .select("id", { count: "exact", head: true })
            .in("job_id", jobIds)
            .eq("direction", "right")
            .gte("created_at", since14)
            .lt("created_at", since7)
        : Promise.resolve({ count: 0 }),
    ])

  const matches = matchesRes.count || 0
  const shortlisted = shortlistedRes.count || 0
  const activeJobs = jobs.filter((j) => j.is_active).length
  const applications = (applicationsRes.data || []).length
  const recentMatches = (recentMatchesRes.data || []) as MatchRow[]

  const applications30d = (appTimelineRes.data || []).length
  const inbLast7 = inbLast7Res.count ?? 0
  const inbPrev7 = inbPrev7Res.count ?? 0
  const wowInbound = weekOverWeekHint(inbLast7, inbPrev7)

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
    .map((j) => ({
      name: j.title.length > 24 ? `${j.title.slice(0, 24)}…` : j.title,
      applications: perJobApps.get(j.id) || 0,
    }))
    .filter((x) => x.applications > 0)
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 8)

  const sumInb30 = timeline.reduce((a, d) => a + d.applications, 0)
  const sumMatch30 = timeline.reduce((a, d) => a + d.matches, 0)
  const chartFootnote = `Last 30 days: ${sumInb30} inbound applications · ${sumMatch30} new matches · ${applications} lifetime inbound applications total.`

  const firstName = fullName?.split(" ")[0]

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <PageSymbol icon={LayoutDashboard} className="shrink-0 lg:mt-1" />
        <div className="min-w-0 flex-1">
          <DashboardPageHeader
            eyebrow="Recruiter overview"
            title={firstName ? `${firstName}, here’s your pipeline` : "Hiring pipeline"}
            description="Inbound interest, mutual matches, and role performance — sourced from your live postings and candidate interactions."
            action={
              <Link
                href="/jobs/new"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-body text-sm font-medium text-primary-foreground transition hover:bg-[var(--clearpath-navy-hover)]"
              >
                New job
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            }
          />
        </div>
      </div>

      <section aria-labelledby="rec-kpi-heading">
        <h2 id="rec-kpi-heading" className="sr-only">
          Key metrics
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardKpiCard
            icon={Briefcase}
            label="Active roles"
            value={activeJobs}
            hint={`${jobs.length} total posted · ${Math.max(0, jobs.length - activeJobs)} paused or closed`}
          />
          <DashboardKpiCard
            icon={Inbox}
            label="Inbound (30d)"
            value={applications30d}
            hint={
              wowInbound
                ? `${wowInbound} · ${inbLast7} applications in the last 7 days`
                : `${inbLast7} applications in the last 7 days`
            }
          />
          <DashboardKpiCard icon={Users} label="Mutual matches" value={matches} hint="Candidates where both sides matched" />
          <DashboardKpiCard icon={Star} label="Shortlisted" value={shortlisted} hint="Candidates marked shortlisted in Matches" />
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="rec-activity-heading">
        <div>
          <h2 id="rec-activity-heading" className="font-heading text-lg font-semibold tracking-tight text-foreground">
            Performance
          </h2>
          <p className="font-body mt-1 text-sm text-muted-foreground">
            Trends are computed from inbound applications (right swipes on your roles) and new mutual matches.
          </p>
        </div>
        <RecruiterDashboardCharts timeline={timeline} jobBars={jobBars} footnote={chartFootnote} />
      </section>

      <div className="space-y-6">
        <DashboardPanel title="Roles" description="Status and lifetime inbound volume per posting." badge={`${jobs.length} jobs`}>
          {jobs.length === 0 ? (
            <DashboardEmptyState
              icon={Briefcase}
              title="No roles yet"
              description="Create a posting to start receiving inbound applications from students who swipe right."
              primaryAction={{ href: "/jobs/new", label: "Create a job" }}
              secondaryAction={{ href: "/discover", label: "Discover candidates" }}
            />
          ) : (
            <div className={dashTable.scroll}>
              <table className={dashTable.table}>
                <thead>
                  <tr>
                    <th className={dashTable.th}>Title</th>
                    <th className={dashTable.th}>Status</th>
                    <th className={dashTable.th}>Posted</th>
                    <th className={`${dashTable.th} text-right`}>Inbound</th>
                    <th className={`${dashTable.th} text-right`}> </th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-muted/50">
                      <td className={dashTable.td}>
                        <span className="font-medium">{job.title}</span>
                      </td>
                      <td className={dashTable.tdMuted}>
                        {job.is_active ? (
                          <Badge variant="success" className="font-normal">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="font-normal">
                            Paused
                          </Badge>
                        )}
                      </td>
                      <td className={dashTable.tdMuted}>{formatDate(job.created_at)}</td>
                      <td className={dashTable.tdNum}>{perJobApps.get(job.id) || 0}</td>
                      <td className={`${dashTable.td} text-right`}>
                        <Link href={`/jobs/${job.id}`} className={dashTable.link}>
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Recent matches"
          description="New mutual matches — message candidates when chat is ready."
          badge={`${recentMatches.length} recent`}
        >
          {recentMatches.length === 0 ? (
            <DashboardEmptyState
              icon={Users}
              title="No matches yet"
              description="When a student applies to your role and you both show interest, they will appear here and in Matches."
              primaryAction={{ href: "/discover", label: "Browse candidates" }}
              secondaryAction={{ href: "/matches", label: "Open Matches" }}
            />
          ) : (
            <div className={dashTable.scroll}>
              <table className={dashTable.table}>
                <thead>
                  <tr>
                    <th className={dashTable.th}>Candidate</th>
                    <th className={dashTable.th}>Role</th>
                    <th className={dashTable.th}>Matched</th>
                    <th className={`${dashTable.th} text-right`}> </th>
                  </tr>
                </thead>
                <tbody>
                  {recentMatches.map((m) => {
                    const chat = conversationChatHref(m.conversations)
                    const roleTitle = coalesceRelation(m.jobs)?.title || "—"
                    return (
                      <tr key={m.id} className="hover:bg-muted/50">
                        <td className={dashTable.td}>
                          <span className="font-medium">{m.profiles?.[0]?.full_name || "Candidate"}</span>
                        </td>
                        <td className={dashTable.tdMuted}>{roleTitle}</td>
                        <td className={dashTable.tdMuted}>{formatDate(m.created_at)}</td>
                        <td className={`${dashTable.td} text-right`}>
                          {chat ? (
                            <Link href={chat} className={dashTable.link}>
                              Open chat
                            </Link>
                          ) : (
                            <Link href="/matches" className={dashTable.link}>
                              Matches
                            </Link>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </DashboardPanel>
      </div>
    </div>
  )
}
