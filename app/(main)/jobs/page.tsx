import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import type { Job } from "@/types"

type JobIdRow = { job_id: string }

function formatJobType(raw: string) {
  return raw.replace(/_/g, " ")
}

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

  const jobIds = (jobs || []).map((j: Job) => j.id)

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

  const perJobStats: Record<string, { applications: number; matches: number; views: number }> = {}
  for (const s of (appResult.data || []) as JobIdRow[]) {
    if (!perJobStats[s.job_id]) perJobStats[s.job_id] = { applications: 0, matches: 0, views: 0 }
    perJobStats[s.job_id].applications++
  }
  for (const m of (matchResult.data || []) as JobIdRow[]) {
    if (!perJobStats[m.job_id]) perJobStats[m.job_id] = { applications: 0, matches: 0, views: 0 }
    perJobStats[m.job_id].matches++
  }
  for (const v of (viewResult.data || []) as JobIdRow[]) {
    if (!perJobStats[v.job_id]) perJobStats[v.job_id] = { applications: 0, matches: 0, views: 0 }
    perJobStats[v.job_id].views++
  }

  const totalApplications = (appResult.data || []).length
  const totalMatches = (matchResult.data || []).length
  const totalCandidatesViewed = (viewResult.data || []).length
  const activeJobs = (jobs || []).filter((j: Job) => j.is_active).length
  const isApproved = recruiterProfile && "is_approved" in recruiterProfile
    ? (recruiterProfile as { is_approved?: boolean }).is_approved
    : false

  const overallMatchRate = totalApplications > 0 ? Math.round((totalMatches / totalApplications) * 100) : 0
  const funnelMax = Math.max(totalCandidatesViewed, totalApplications, totalMatches, 1)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <header className="flex flex-col gap-2 min-w-0">
          <div className="space-y-1 min-w-0">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-950 sm:text-[1.75rem]">Jobs</h1>
            <p className="font-body text-sm text-neutral-600">
              {activeJobs} active · {jobs?.length || 0} total listing{(jobs?.length || 0) === 1 ? "" : "s"}
            </p>
          </div>
        </header>
        <Link
          href="/jobs/new"
          className="inline-flex justify-center rounded-full bg-neutral-950 px-5 py-2.5 font-body text-sm font-medium text-white transition hover:bg-neutral-800 shrink-0"
        >
          Post a job
        </Link>
      </div>

      {!isApproved && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 px-4 py-4 sm:px-5 border-l-4 border-l-amber-400">
          <p className="font-heading text-xs font-semibold uppercase tracking-wide text-amber-900/80">
            Pending admin approval
          </p>
          <p className="font-body text-sm text-neutral-700 mt-2">
            You can create and manage jobs now. Candidates won&apos;t see listings until your recruiter account is
            approved.
          </p>
        </div>
      )}

      {(jobs?.length || 0) > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl bg-neutral-200/80 overflow-hidden border border-neutral-200/80">
            {[
              { label: "Active listings", value: activeJobs },
              { label: "Applications", value: totalApplications },
              { label: "Matches", value: totalMatches },
              { label: "Profiles reviewed", value: totalCandidatesViewed },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white px-4 py-4">
                <p className="font-heading text-xl font-semibold tabular-nums text-neutral-950 sm:text-2xl">{value}</p>
                <p className="font-body text-xs text-neutral-500 mt-1">{label}</p>
                {label === "Matches" && totalApplications > 0 && (
                  <p className="font-body text-[11px] text-neutral-400 mt-1">{overallMatchRate}% of applications</p>
                )}
              </div>
            ))}
          </div>

          {totalApplications > 0 && (
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="flex items-baseline justify-between gap-4 mb-4">
                <h2 className="font-heading text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Funnel (all roles)
                </h2>
                <span className="font-body text-xs text-neutral-400">All time</span>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Profiles reviewed", value: totalCandidatesViewed },
                  { label: "Applications received", value: totalApplications },
                  { label: "Mutual matches", value: totalMatches },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <p className="font-body text-xs text-neutral-500 w-36 shrink-0">{label}</p>
                    <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-neutral-800 transition-all"
                        style={{ width: `${Math.min(100, Math.round((value / funnelMax) * 100))}%` }}
                      />
                    </div>
                    <p className="font-heading text-sm font-semibold tabular-nums text-neutral-950 w-8 text-right">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {!jobs?.length ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/50 px-6 py-14 text-center">
          <h3 className="font-heading text-lg font-semibold text-neutral-950">No jobs yet</h3>
          <p className="font-body text-sm text-neutral-600 mt-2 max-w-md mx-auto">
            Create a listing to appear in student discovery and start receiving applications.
          </p>
          <Link
            href="/jobs/new"
            className="inline-flex mt-8 rounded-full bg-neutral-950 px-6 py-2.5 font-body text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Post your first job
          </Link>
          <div className="mt-10 max-w-md mx-auto text-left rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h4 className="font-heading text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">
              Tips
            </h4>
            <ol className="list-decimal list-inside space-y-2 font-body text-sm text-neutral-600">
              <li>List must-have skills so the right students self-select.</li>
              <li>Describe impact and learning — not only requirements.</li>
              <li>Remote-friendly roles reach more qualified applicants.</li>
              <li>Keep requirements realistic to avoid empty pipelines.</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="font-body text-sm text-neutral-500">Open a job to edit details and review applicants.</p>
          <ul className="space-y-3 list-none p-0 m-0">
            {(jobs || []).map((job: Job) => {
              const stats = perJobStats[job.id] || { applications: 0, matches: 0, views: 0 }
              const matchRate = stats.applications > 0 ? Math.round((stats.matches / stats.applications) * 100) : 0
              const metaParts = [
                formatJobType(job.job_type),
                job.is_remote ? "Remote" : job.location || null,
                `Posted ${formatDate(job.created_at)}`,
              ].filter(Boolean)

              return (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/15"
                  >
                    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-neutral-300">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-semibold text-base text-neutral-950 leading-snug">
                            {job.title}
                          </h3>
                          <p className="font-body text-xs text-neutral-500 mt-1.5">{metaParts.join(" · ")}</p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 font-body text-[11px] font-medium ${
                            job.is_active
                              ? "bg-neutral-100 text-neutral-800"
                              : "border border-neutral-200 text-neutral-500"
                          }`}
                        >
                          {job.is_active ? "Active" : "Paused"}
                        </span>
                      </div>

                      {job.required_skills && job.required_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {job.required_skills.slice(0, 5).map((s: string) => (
                            <span
                              key={s}
                              className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-body text-[11px] text-neutral-700"
                            >
                              {s}
                            </span>
                          ))}
                          {job.required_skills.length > 5 && (
                            <span className="rounded-md border border-neutral-100 px-2 py-0.5 font-body text-[11px] text-neutral-500">
                              +{job.required_skills.length - 5}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-3 gap-4">
                        <div>
                          <p className="font-heading text-lg font-semibold tabular-nums text-neutral-950">
                            {stats.applications}
                          </p>
                          <p className="font-body text-[11px] text-neutral-500 mt-0.5">Applications</p>
                        </div>
                        <div>
                          <p className="font-heading text-lg font-semibold tabular-nums text-neutral-950">
                            {stats.matches}
                          </p>
                          <p className="font-body text-[11px] text-neutral-500 mt-0.5">Matches</p>
                        </div>
                        <div>
                          <p className="font-heading text-lg font-semibold tabular-nums text-neutral-950">
                            {matchRate}%
                          </p>
                          <p className="font-body text-[11px] text-neutral-500 mt-0.5">Match rate</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
