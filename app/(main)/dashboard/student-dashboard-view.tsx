import Link from "next/link"
import { Bookmark, Heart, LayoutDashboard, Percent, Send, ArrowRight } from "lucide-react"
import { PageSymbol } from "@/components/ui/page-symbol"
import { createClient } from "@/lib/supabase/server"
import { DashboardPanel } from "@/components/dashboard/DashboardPanel"
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader"
import { DashboardKpiCard } from "@/components/dashboard/DashboardKpiCard"
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState"
import { StudentDashboardCharts } from "@/components/dashboard/StudentDashboardCharts"
import { cn, formatDate } from "@/lib/utils"
import { daysLastN, shortDayLabel } from "@/lib/dashboard/time-series"
import { dashTable } from "@/components/dashboard/dashboard-table-styles"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { matchRatePercent, weekOverWeekHint } from "@/lib/dashboard/period-metrics"
import { conversationChatHref } from "@/lib/dashboard/chat-links"
import { coalesceRelation } from "@/lib/dashboard/relations"

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
  jobs: {
    title: string | null
    recruiter_profiles: { company_name: string | null }[] | null
  }[] | null
  conversations: { id: string }[] | null
}

type SwipeTimelineRow = { created_at: string; direction: string }
type MatchTimelineRow = { created_at: string }

export async function StudentDashboardView({ userId, fullName }: { userId: string; fullName: string | null }) {
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

  const [
    appliedRes,
    savedRes,
    matchesRes,
    savedJobsRes,
    recentMatchesRes,
    swipesTimelineRes,
    matchesTimelineRes,
    appliedLast7Res,
    appliedPrev7Res,
  ] = await Promise.all([
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
      .select(
        "id, created_at, profiles!matches_recruiter_id_fkey(full_name), jobs(title, recruiter_profiles(company_name)), conversations(id)"
      )
      .eq("student_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("job_swipes").select("created_at, direction").eq("student_id", userId).gte("created_at", since),
    supabase.from("matches").select("created_at").eq("student_id", userId).gte("created_at", since),
    supabase
      .from("job_swipes")
      .select("id", { count: "exact", head: true })
      .eq("student_id", userId)
      .eq("direction", "right")
      .gte("created_at", since7),
    supabase
      .from("job_swipes")
      .select("id", { count: "exact", head: true })
      .eq("student_id", userId)
      .eq("direction", "right")
      .gte("created_at", since14)
      .lt("created_at", since7),
  ])

  const applied = appliedRes.count || 0
  const saved = savedRes.count || 0
  const matches = matchesRes.count || 0
  const savedJobs = (savedJobsRes.data || []) as SavedJobRow[]
  const recentMatches = (recentMatchesRes.data || []) as MatchRow[]

  const appliedLast7 = appliedLast7Res.count || 0
  const appliedPrev7 = appliedPrev7Res.count || 0
  const wowApplications = weekOverWeekHint(appliedLast7, appliedPrev7)
  const matchRate = matchRatePercent(matches, applied)

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

  const sumApplied30 = activity.reduce((acc, d) => acc + d.applied, 0)
  const sumSaved30 = activity.reduce((acc, d) => acc + d.saved, 0)
  const sumMatches30 = matchesSeries.reduce((acc, d) => acc + d.matches, 0)

  const chartFootnote = `Last 30 days: ${sumApplied30} applications · ${sumSaved30} saves · ${sumMatches30} new matches (from your live data).`

  const firstName = fullName?.split(" ")[0]

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <PageSymbol icon={LayoutDashboard} className="shrink-0 lg:mt-1" />
        <div className="min-w-0 flex-1">
          <DashboardPageHeader
            eyebrow="Student overview"
            title={firstName ? `Welcome back, ${firstName}` : "Your overview"}
            description="Track applications, saves, and mutual matches. Everything below is computed from your account — not sample data."
            action={
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-body text-sm font-medium text-primary-foreground transition hover:bg-[var(--clearpath-navy-hover)]"
              >
                Discover roles
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            }
          />
        </div>
      </div>

      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="sr-only">
          Key metrics
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardKpiCard
            icon={Send}
            label="Applications"
            value={applied}
            hint={
              wowApplications
                ? `${wowApplications} · ${appliedLast7} in the last 7 days`
                : `${appliedLast7} applications in the last 7 days`
            }
          />
          <DashboardKpiCard icon={Bookmark} label="Saved roles" value={saved} hint="Roles you bookmarked for later" />
          <DashboardKpiCard icon={Heart} label="Mutual matches" value={matches} hint="Recruiters who matched you back" />
          <DashboardKpiCard
            icon={Percent}
            label="Match rate"
            value={applied > 0 ? `${matchRate}%` : "—"}
            hint={applied > 0 ? "Matches ÷ applications (lifetime)" : "Apply to at least one role to see a rate"}
          />
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="activity-heading">
        <div>
          <h2 id="activity-heading" className="font-heading text-lg font-semibold tracking-tight text-foreground">
            Activity
          </h2>
          <p className="font-body mt-1 text-sm text-muted-foreground">
            Daily counts from your swipes and new matches. Empty days simply mean no events that day.
          </p>
        </div>
        <StudentDashboardCharts activity={activity} matchesSeries={matchesSeries} footnote={chartFootnote} />
      </section>

      <div className="space-y-6">
        <DashboardPanel
          title="Saved jobs"
          description="Most recently bookmarked roles — same list you maintain in Saved."
          badge={`${savedJobs.length} saved`}
        >
          {savedJobs.length === 0 ? (
            <DashboardEmptyState
              icon={Bookmark}
              title="No saved roles yet"
              description="Save roles while you browse Discover to compare employers and revisit later."
              primaryAction={{ href: "/discover", label: "Browse Discover" }}
              secondaryAction={{ href: "/saved", label: "Open Saved" }}
            />
          ) : (
            <div className={cn(dashTable.frame, "overflow-hidden")}>
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow className={dashTable.headerRow}>
                    <TableHead className={dashTable.head}>Role</TableHead>
                    <TableHead className={dashTable.head}>Company</TableHead>
                    <TableHead className={dashTable.head}>Type</TableHead>
                    <TableHead className={dashTable.head}>Saved</TableHead>
                    <TableHead className={cn(dashTable.head, "text-right")} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedJobs.map((row) => {
                    const job = coalesceRelation(row.jobs)
                    const companyName = job?.recruiter_profiles?.[0]?.company_name || "—"
                    const href = job?.id ? `/jobs/${job.id}` : "/saved"
                    return (
                      <TableRow key={row.id}>
                        <TableCell className={dashTable.cell}>
                          <span className="font-medium">{job?.title || "Untitled role"}</span>
                        </TableCell>
                        <TableCell className={dashTable.cellMuted}>{companyName}</TableCell>
                        <TableCell className={dashTable.cellMuted}>{job?.job_type?.replace(/_/g, " ") || "—"}</TableCell>
                        <TableCell className={dashTable.cellMuted}>{formatDate(row.created_at)}</TableCell>
                        <TableCell className={cn(dashTable.cell, "text-right")}>
                          <Link href={href} className={dashTable.link}>
                            View listing
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Recent matches"
          description="Mutual interest — open a thread when chat is available."
          badge={`${recentMatches.length} shown`}
        >
          {recentMatches.length === 0 ? (
            <DashboardEmptyState
              icon={Heart}
              title="No matches yet"
              description="When you apply and a recruiter returns interest, the match appears here and in your Matches inbox."
              primaryAction={{ href: "/discover", label: "Go to Discover" }}
              secondaryAction={{ href: "/matches", label: "Matches" }}
            />
          ) : (
            <div className={cn(dashTable.frame, "overflow-hidden")}>
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow className={dashTable.headerRow}>
                    <TableHead className={dashTable.head}>Role</TableHead>
                    <TableHead className={dashTable.head}>Company</TableHead>
                    <TableHead className={dashTable.head}>Recruiter</TableHead>
                    <TableHead className={dashTable.head}>Matched</TableHead>
                    <TableHead className={cn(dashTable.head, "text-right")} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentMatches.map((m) => {
                    const job = coalesceRelation(m.jobs)
                    const chat = conversationChatHref(m.conversations)
                    const recruiterName = m.profiles?.[0]?.full_name || "—"
                    return (
                      <TableRow key={m.id}>
                        <TableCell className={dashTable.cell}>
                          <span className="font-medium">{job?.title || "—"}</span>
                        </TableCell>
                        <TableCell className={dashTable.cellMuted}>{job?.recruiter_profiles?.[0]?.company_name || "—"}</TableCell>
                        <TableCell className={dashTable.cellMuted}>{recruiterName}</TableCell>
                        <TableCell className={dashTable.cellMuted}>{formatDate(m.created_at)}</TableCell>
                        <TableCell className={cn(dashTable.cell, "text-right")}>
                          {chat ? (
                            <Link href={chat} className={dashTable.link}>
                              Open chat
                            </Link>
                          ) : (
                            <Link href="/matches" className={dashTable.link}>
                              Matches
                            </Link>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </DashboardPanel>
      </div>
    </div>
  )
}
