"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { SwipeCard } from "@/components/swipe/SwipeCard"
import { JobCard } from "@/components/swipe/JobCard"
import { useToast } from "@/lib/hooks/use-toast"
import { X, Heart, Bookmark, Building2 } from "lucide-react"
import type { Job } from "@/types"

interface Stats {
  applied: number
  saved: number
  matches: number
  total: number
}

type JobSwipeRow = { job_id: string; direction: string }

const JOB_TYPE_LABEL: Record<string, string> = {
  internship: "Internship",
  full_time:  "Full-time",
  part_time:  "Part-time",
  contract:   "Contract",
}

export function StudentDiscoverView({ userId }: { userId: string }) {
  const { toast } = useToast()
  const [jobs, setJobs] = useState<Job[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [swiping, setSwiping] = useState(false)
  const [stats, setStats] = useState<Stats>({ applied: 0, saved: 0, matches: 0, total: 0 })

  async function loadJobs() {
    setLoading(true)
    const supabase = createClient()

    const [swipesRes, matchesRes] = await Promise.all([
      supabase.from("job_swipes").select("job_id, direction").eq("student_id", userId),
      supabase.from("matches").select("id", { count: "exact", head: true }).eq("student_id", userId),
    ])

    const swipes = (swipesRes.data || []) as JobSwipeRow[]
    const swipedJobIds = swipes.map((s) => s.job_id)
    const applied = swipes.filter((s) => s.direction === "right").length
    const saved   = swipes.filter((s) => s.direction === "saved").length

    setStats({ applied, saved, matches: matchesRes.count || 0, total: swipes.length })

    let query = supabase
      .from("jobs")
      .select("*, recruiter_profiles(id, company_name, logo_url, website_url, description)")
      .eq("is_active", true)

    if (swipedJobIds.length > 0) {
      query = query.not("id", "in", `(${swipedJobIds.join(",")})`)
    }

    const { data } = await query.order("created_at", { ascending: false }).limit(20)
    setJobs(data || [])
    setCurrentIndex(0)
    setLoading(false)
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadJobs()
    })
  }, [])

  const handleSwipe = useCallback(async (direction: "right" | "left" | "saved") => {
    if (swiping || currentIndex >= jobs.length) return
    const job = jobs[currentIndex]
    setSwiping(true)
    const supabase = createClient()
    await supabase.from("job_swipes").insert({ student_id: userId, job_id: job.id, direction })

    if (direction === "right") {
      toast({ title: "Applied!", description: `You applied for ${job.title}` })
      setStats(prev => ({ ...prev, applied: prev.applied + 1, total: prev.total + 1 }))
    } else if (direction === "saved") {
      toast({ title: "Saved for later" })
      setStats(prev => ({ ...prev, saved: prev.saved + 1, total: prev.total + 1 }))
    } else {
      setStats(prev => ({ ...prev, total: prev.total + 1 }))
    }
    setCurrentIndex(prev => prev + 1)
    setTimeout(() => setSwiping(false), 100)
  }, [userId, swiping, currentIndex, jobs, toast])

  const currentJob = jobs[currentIndex]
  const nextJob    = jobs[currentIndex + 1]
  const remaining  = jobs.length - currentIndex

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-9 w-9 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin"
            aria-hidden
          />
          <p className="font-body text-sm text-neutral-600">Loading roles…</p>
        </div>
      </div>
    )
  }

  const company = currentJob?.recruiter_profiles ?? null

  const noJobsAvailable = jobs.length === 0

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-heading font-bold text-3xl tracking-tight text-neutral-950">Discover</h1>
        <p className="font-body text-sm text-neutral-600 max-w-lg">
          {noJobsAvailable
            ? "There are no new listings right now. Try again soon."
            : remaining > 0
              ? `${remaining} role${remaining === 1 ? "" : "s"} left in this batch — swipe or use the actions below.`
              : "You're up to date with this batch."}
        </p>
      </header>

      {/* Stats — typographic, minimal */}
      <div className="grid grid-cols-3 gap-px rounded-2xl bg-neutral-200/80 overflow-hidden border border-neutral-200/80">
        {[
          { label: "Applied", value: stats.applied },
          { label: "Saved", value: stats.saved },
          { label: "Matches", value: stats.matches },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white px-4 py-4 text-center sm:text-left"
          >
            <p className="font-heading text-2xl font-semibold tabular-nums text-neutral-950">{value}</p>
            <p className="font-body text-xs text-neutral-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {currentIndex >= jobs.length ? (
        noJobsAvailable ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50/50 px-8 py-16 text-center">
            <h3 className="font-heading text-xl font-semibold text-neutral-950">No open roles</h3>
            <p className="font-body text-sm text-neutral-600 mt-2 max-w-md mx-auto">
              Nothing new to show yet. We&apos;ll surface listings here as soon as they go live.
            </p>
            <button
              type="button"
              onClick={() => void loadJobs()}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-neutral-950 px-6 py-2.5 font-body text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Check again
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 text-center py-12 rounded-2xl border border-neutral-200 bg-white">
            <div className="h-px w-12 bg-neutral-300" aria-hidden />
            <div>
              <h3 className="font-heading text-xl font-semibold text-neutral-950">Batch complete</h3>
              <p className="font-body text-sm text-neutral-600 mt-2 max-w-sm mx-auto">
                You&apos;ve seen every role in this set. Refresh to pull the latest from the feed.
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-6 w-full max-w-md text-left px-6 sm:px-0">
              <div>
                <dt className="font-body text-xs text-neutral-500">Applied</dt>
                <dd className="font-heading text-lg font-semibold tabular-nums text-neutral-950 mt-0.5">{stats.applied}</dd>
              </div>
              <div>
                <dt className="font-body text-xs text-neutral-500">Saved</dt>
                <dd className="font-heading text-lg font-semibold tabular-nums text-neutral-950 mt-0.5">{stats.saved}</dd>
              </div>
              <div>
                <dt className="font-body text-xs text-neutral-500">Matches</dt>
                <dd className="font-heading text-lg font-semibold tabular-nums text-neutral-950 mt-0.5">{stats.matches}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => void loadJobs()}
              className="rounded-full bg-neutral-950 px-6 py-2.5 font-body text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Refresh feed
            </button>
          </div>
        )
      ) : (
        /* ── Two-column desktop layout ── */
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">

          {/* Left: swipe card + action buttons */}
          <div className="flex flex-col items-center gap-5 lg:sticky lg:top-6">
            <div className="relative w-full max-w-sm mx-auto">
              {nextJob && (
                <div className="absolute inset-0 scale-[0.96] -translate-y-3 opacity-60 pointer-events-none rounded-3xl overflow-hidden">
                  <JobCard job={nextJob} />
                </div>
              )}
              <SwipeCard
                key={currentJob.id}
                onSwipeLeft={() => handleSwipe("left")}
                onSwipeRight={() => handleSwipe("right")}
                disabled={swiping}
              >
                <JobCard job={currentJob} />
              </SwipeCard>
            </div>

            <div className="flex justify-center items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => handleSwipe("left")}
                disabled={swiping}
                aria-label="Pass on this role"
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border border-neutral-200 bg-white text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.97] disabled:opacity-50"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6 mx-auto" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => handleSwipe("saved")}
                disabled={swiping}
                aria-label="Save for later"
                className="h-11 w-11 sm:h-12 sm:w-12 rounded-full border border-neutral-200 bg-white text-neutral-500 transition hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.97] disabled:opacity-50"
              >
                <Bookmark className="h-4 w-4 sm:h-5 sm:w-5 mx-auto" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => handleSwipe("right")}
                disabled={swiping}
                aria-label="Apply to this role"
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-neutral-950 text-white shadow-sm transition hover:bg-neutral-800 active:scale-[0.97] disabled:opacity-50"
              >
                <Heart className="h-5 w-5 sm:h-6 sm:w-6 mx-auto" fill="currentColor" stroke="currentColor" strokeWidth={1.5} />
              </button>
            </div>
            <p className="font-body text-xs text-neutral-500 text-center max-w-[16rem]">
              Swipe the card or tap: pass · save · apply
            </p>
          </div>

          {/* Right: job detail panel */}
          <div className="space-y-6">
            <article className="rounded-2xl bg-white border border-neutral-200 overflow-hidden shadow-sm">
              <div className="h-32 bg-neutral-950 flex items-end px-6 pb-5">
                <div className="flex items-end gap-4 min-w-0">
                  {company?.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt=""
                      className="h-14 w-14 rounded-xl object-cover ring-1 ring-white/10 shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center shrink-0 ring-1 ring-white/10">
                      <Building2 className="h-6 w-6 text-white/80" aria-hidden />
                    </div>
                  )}
                  <div className="min-w-0 pb-0.5">
                    <h2 className="font-heading font-semibold text-lg sm:text-xl text-white leading-snug tracking-tight">
                      {currentJob.title}
                    </h2>
                    {company?.company_name && (
                      <p className="font-body text-sm text-white/65 mt-1 truncate">{company.company_name}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-neutral-100 px-3 py-1 font-body text-xs font-medium text-neutral-800">
                    {JOB_TYPE_LABEL[currentJob.job_type] ?? currentJob.job_type}
                  </span>
                  {currentJob.is_remote ? (
                    <span className="rounded-full bg-neutral-100 px-3 py-1 font-body text-xs font-medium text-neutral-600">
                      Remote
                    </span>
                  ) : currentJob.location ? (
                    <span className="rounded-full bg-neutral-100 px-3 py-1 font-body text-xs font-medium text-neutral-600">
                      {currentJob.location}
                    </span>
                  ) : null}
                </div>

                {currentJob.description && (
                  <div>
                    <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
                      Role
                    </h3>
                    <p className="font-body text-sm text-neutral-700 leading-relaxed">{currentJob.description}</p>
                  </div>
                )}

                {(currentJob.required_skills?.length ?? 0) > 0 && (
                  <div>
                    <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
                      Required
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentJob.required_skills.map((s) => (
                        <span
                          key={s}
                          className="rounded-md border border-neutral-200 bg-neutral-50/80 px-2.5 py-1 font-body text-xs text-neutral-800"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(currentJob.nice_to_have_skills?.length ?? 0) > 0 && (
                  <div>
                    <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
                      Nice to have
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentJob.nice_to_have_skills.map((s) => (
                        <span
                          key={s}
                          className="rounded-md border border-neutral-100 bg-white px-2.5 py-1 font-body text-xs text-neutral-600"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {company?.description && (
                  <div>
                    <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
                      {company.company_name ? `About ${company.company_name}` : "Company"}
                    </h3>
                    <p className="font-body text-sm text-neutral-700 leading-relaxed">{company.description}</p>
                  </div>
                )}

                {company?.website_url && (
                  <a
                    href={company.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block font-body text-sm font-medium text-neutral-950 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950 transition-colors"
                  >
                    Company website
                  </a>
                )}

                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 pt-4 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => handleSwipe("left")}
                    disabled={swiping}
                    className="flex-1 rounded-xl border border-neutral-200 py-3 font-body text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
                  >
                    Pass
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwipe("saved")}
                    disabled={swiping}
                    className="flex-1 rounded-xl border border-neutral-200 py-3 font-body text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50 sm:max-w-[8rem]"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwipe("right")}
                    disabled={swiping}
                    className="flex-1 rounded-xl bg-neutral-950 py-3 font-body text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </article>

            {jobs.slice(currentIndex + 1, currentIndex + 4).length > 0 && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">
                  Up next
                </h3>
                <ul className="space-y-1">
                  {jobs.slice(currentIndex + 1, currentIndex + 4).map((job, i) => {
                    const co = job.recruiter_profiles
                    return (
                      <li
                        key={job.id}
                        className="flex items-center gap-3 rounded-xl py-2.5 px-1 -mx-1 text-neutral-600"
                      >
                        {co?.logo_url ? (
                          <img src={co.logo_url} alt="" className="h-9 w-9 rounded-lg object-cover ring-1 ring-neutral-200 shrink-0" />
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-neutral-100 shrink-0" aria-hidden />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm font-medium text-neutral-950 truncate">{job.title}</p>
                          <p className="font-body text-xs text-neutral-500 truncate">{co?.company_name ?? "Company"}</p>
                        </div>
                        <span className="font-body text-xs tabular-nums text-neutral-400 shrink-0">{i + 2}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5">
              <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">
                How matching works
              </h3>
              <ol className="list-decimal list-inside space-y-2 font-body text-sm text-neutral-600">
                <li>Apply sends your profile to the recruiter right away.</li>
                <li>A match is when they express interest back.</li>
                <li>Matched pairs can chat in-app to coordinate next steps.</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
