import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, MapPin, Wifi, Calendar, Briefcase, TrendingUp, Heart, Eye, ChevronRight, Zap, Users, BarChart2, AlertCircle } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default async function JobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "recruiter") redirect("/discover")

  const { data: recruiterProfile } = await supabase
    .from("recruiter_profiles").select("*").eq("id", user.id).maybeSingle()

  const { data: jobs } = await supabase
    .from("jobs").select("*").eq("recruiter_id", user.id).order("created_at", { ascending: false })

  const jobIds = (jobs || []).map((j: any) => j.id)

  // Fetch per-job stats in parallel
  const [appResult, matchResult, viewResult] = await Promise.all([
    jobIds.length > 0
      ? supabase.from("job_swipes").select("job_id").in("job_id", jobIds).eq("direction", "right")
      : Promise.resolve({ data: [] }),
    jobIds.length > 0
      ? supabase.from("matches").select("job_id").eq("recruiter_id", user.id)
      : Promise.resolve({ data: [] }),
    jobIds.length > 0
      ? supabase.from("candidate_swipes").select("job_id").eq("recruiter_id", user.id)
      : Promise.resolve({ data: [] }),
  ])

  // Build per-job lookup maps
  const perJobStats: Record<string, { applications: number; matches: number; views: number }> = {}
  for (const s of (appResult.data || []) as any[]) {
    if (!perJobStats[s.job_id]) perJobStats[s.job_id] = { applications: 0, matches: 0, views: 0 }
    perJobStats[s.job_id].applications++
  }
  for (const m of (matchResult.data || []) as any[]) {
    if (!perJobStats[m.job_id]) perJobStats[m.job_id] = { applications: 0, matches: 0, views: 0 }
    perJobStats[m.job_id].matches++
  }
  for (const v of (viewResult.data || []) as any[]) {
    if (!perJobStats[v.job_id]) perJobStats[v.job_id] = { applications: 0, matches: 0, views: 0 }
    perJobStats[v.job_id].views++
  }

  // Aggregate totals
  const totalApplications = (appResult.data || []).length
  const totalMatches = (matchResult.data || []).length
  const totalCandidatesViewed = (viewResult.data || []).length
  const activeJobs = (jobs || []).filter((j: any) => j.is_active).length
  const isApproved = (recruiterProfile as any)?.is_approved

  const overallMatchRate = totalApplications > 0
    ? Math.round((totalMatches / totalApplications) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-white">My Jobs</h1>
          <p className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8] mt-0.5">
            {activeJobs} active · {jobs?.length || 0} total postings
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#EA580C] to-[#F7931A] text-white font-body font-semibold text-xs shadow-[0_0_15px_-5px_rgba(234,88,12,0.5)] hover:shadow-[0_0_25px_-5px_rgba(247,147,26,0.7)] transition-all duration-300"
        >
          <Plus className="h-3.5 w-3.5" />Post Job
        </Link>
      </div>

      {/* Approval banner */}
      {!isApproved && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FFD600]/8 border border-[#FFD600]/25">
          <AlertCircle className="h-4 w-4 text-[#FFD600] shrink-0 mt-0.5" />
          <div>
            <p className="font-data text-[10px] tracking-widest uppercase text-[#FFD600] mb-0.5">Pending Admin Approval</p>
            <p className="font-body text-xs text-[#94A3B8]">
              Your recruiter account is under review. You can create and manage jobs, but candidates won&apos;t see your postings until an admin approves your account.
            </p>
          </div>
        </div>
      )}

      {/* Analytics overview — only when jobs exist */}
      {(jobs?.length || 0) > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Active Jobs", value: activeJobs, icon: Briefcase, color: "#F7931A" },
              { label: "Total Applications", value: totalApplications, icon: TrendingUp, color: "#FFD600" },
              { label: "Mutual Matches", value: totalMatches, icon: Heart, color: "#EA580C" },
              { label: "Candidates Viewed", value: totalCandidatesViewed, icon: Eye, color: "#94A3B8" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl bg-[#0F1115] border border-white/8 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-data text-[9px] tracking-wider uppercase text-[#94A3B8]">{label}</p>
                  <Icon className="h-3.5 w-3.5" style={{ color }} />
                </div>
                <p className="font-heading font-bold text-2xl" style={{ color }}>{value}</p>
                {label === "Mutual Matches" && totalApplications > 0 && (
                  <p className="font-data text-[9px] text-[#94A3B8] mt-0.5">{overallMatchRate}% match rate</p>
                )}
              </div>
            ))}
          </div>

          {/* Match rate bar */}
          {totalApplications > 0 && (
            <div className="rounded-xl bg-[#0F1115] border border-white/8 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-[#F7931A]" />
                  <p className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8]">Recruitment Funnel</p>
                </div>
                <p className="font-data text-[10px] text-[#94A3B8]">All-time</p>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "Candidates Viewed", value: totalCandidatesViewed, max: Math.max(totalCandidatesViewed, 1), color: "#94A3B8" },
                  { label: "Applications Received", value: totalApplications, max: Math.max(totalCandidatesViewed, 1), color: "#FFD600" },
                  { label: "Mutual Matches", value: totalMatches, max: Math.max(totalCandidatesViewed, 1), color: "#F7931A" },
                ].map(({ label, value, max, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <p className="font-data text-[9px] tracking-wider uppercase text-[#94A3B8] w-36 shrink-0">{label}</p>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((value / max) * 100)}%`, background: color }}
                      />
                    </div>
                    <p className="font-heading font-bold text-sm w-8 text-right" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!jobs?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#F7931A]/15 border border-[#F7931A]/30 flex items-center justify-center">
            <Briefcase className="h-8 w-8 text-[#F7931A]" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-lg text-white">No jobs posted yet</h3>
            <p className="font-body text-sm text-[#94A3B8] mt-1 max-w-[260px]">
              Post your first position to start discovering talented candidates through swipe-based matching.
            </p>
          </div>
          <Link
            href="/jobs/new"
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#EA580C] to-[#F7931A] text-white font-body font-semibold text-sm shadow-[0_0_20px_-5px_rgba(234,88,12,0.5)] hover:shadow-[0_0_30px_-5px_rgba(247,147,26,0.7)] transition-all duration-300"
          >
            <Plus className="h-4 w-4" />Post Your First Job
          </Link>

          {/* Tips */}
          <div className="w-full max-w-md mt-4 rounded-xl bg-[#0F1115] border border-white/8 p-5 text-left space-y-3">
            <p className="font-data text-[10px] tracking-widest uppercase text-[#94A3B8]">Tips for better matches</p>
            {[
              "Add required skills to surface the right candidates instantly",
              "Write a clear job description highlighting growth opportunities",
              "Enable remote-friendly positions to access a wider talent pool",
              "Set realistic requirements — overly specific roles get fewer swipes",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#F7931A]/15 border border-[#F7931A]/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="font-data text-[9px] text-[#F7931A]">{i + 1}</span>
                </div>
                <p className="font-body text-xs text-[#94A3B8]">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="font-data text-[10px] tracking-widest uppercase text-[#94A3B8] px-1">
            {jobs.length} posting{jobs.length !== 1 ? "s" : ""} — click a job to manage candidates
          </p>
          {(jobs as any[]).map((job) => {
            const stats = perJobStats[job.id] || { applications: 0, matches: 0, views: 0 }
            const matchRate = stats.applications > 0 ? Math.round((stats.matches / stats.applications) * 100) : 0
            return (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <div className="rounded-xl bg-[#0F1115] border border-white/8 p-5 hover:border-[#F7931A]/30 hover:shadow-[0_0_20px_-8px_rgba(247,147,26,0.2)] transition-all duration-300 cursor-pointer">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-semibold text-base text-white leading-tight">{job.title}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 font-data text-[10px] tracking-wider text-[#94A3B8]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{job.job_type.replace(/_/g, " ")}
                        </span>
                        {job.is_remote ? (
                          <span className="flex items-center gap-1 text-[#F7931A]">
                            <Wifi className="h-3 w-3" />Remote
                          </span>
                        ) : job.location ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />{job.location}
                          </span>
                        ) : null}
                        <span>Posted {formatDate(job.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`font-data text-[9px] tracking-widest uppercase px-2 py-1 rounded-full border ${
                        job.is_active
                          ? "bg-[#F7931A]/15 border-[#F7931A]/30 text-[#F7931A]"
                          : "bg-white/5 border-white/15 text-[#94A3B8]"
                      }`}>
                        {job.is_active ? "Active" : "Paused"}
                      </span>
                      <ChevronRight className="h-4 w-4 text-[#94A3B8]" />
                    </div>
                  </div>

                  {/* Skills */}
                  {job.required_skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {job.required_skills.slice(0, 5).map((s: string) => (
                        <span key={s} className="font-data text-[9px] tracking-wider px-2 py-0.5 rounded-full bg-[#F7931A]/10 border border-[#F7931A]/20 text-[#F7931A]">{s}</span>
                      ))}
                      {job.required_skills.length > 5 && (
                        <span className="font-data text-[9px] tracking-wider px-2 py-0.5 rounded-full border border-white/10 text-[#94A3B8]">+{job.required_skills.length - 5}</span>
                      )}
                    </div>
                  )}

                  {/* Per-job stats */}
                  <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-3 gap-4">
                    <div>
                      <p className="font-heading font-bold text-xl text-[#FFD600]">{stats.applications}</p>
                      <p className="font-data text-[9px] tracking-wider uppercase text-[#94A3B8]">Applications</p>
                    </div>
                    <div>
                      <p className="font-heading font-bold text-xl text-[#F7931A]">{stats.matches}</p>
                      <p className="font-data text-[9px] tracking-wider uppercase text-[#94A3B8]">Matches</p>
                    </div>
                    <div>
                      <p className="font-heading font-bold text-xl text-white">{matchRate}%</p>
                      <p className="font-data text-[9px] tracking-wider uppercase text-[#94A3B8]">Match Rate</p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
