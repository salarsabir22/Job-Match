"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { SwipeCard } from "@/components/swipe/SwipeCard"
import { JobCard } from "@/components/swipe/JobCard"
import { useToast } from "@/lib/hooks/use-toast"
import { X, Heart, Bookmark, Building2, Compass } from "lucide-react"
import { PageSymbol } from "@/components/ui/page-symbol"
import { formatDate } from "@/lib/utils"
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
  const [feedLoadedAt, setFeedLoadedAt] = useState<Date | null>(null)

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
      .select("*, recruiter_profiles(id, company_name, logo_url, website_url, description, is_approved)")
      .eq("is_active", true)

    if (swipedJobIds.length > 0) {
      query = query.not("id", "in", `(${swipedJobIds.join(",")})`)
    }

    const { data } = await query.order("created_at", { ascending: false }).limit(20)
    const rows = (data || []) as Job[]
    const approvedOnly = rows.filter((j) => {
      const rp = j.recruiter_profiles as { is_approved?: boolean } | null | undefined
      return rp?.is_approved === true
    })
    setJobs(approvedOnly)
    setCurrentIndex(0)
    setFeedLoadedAt(new Date())
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
            className="h-9 w-9 rounded-full border-2 border-muted border-t-primary animate-spin"
            aria-hidden
          />
          <p className="font-body text-sm text-neutral-600">Loading roles…</p>
        </div>
      </div>
    )
  }

  const company = currentJob?.recruiter_profiles ?? null

  const noJobsAvailable = jobs.length === 0
  const inSession = !noJobsAvailable && currentIndex < jobs.length
  const sessionPosition = inSession ? currentIndex + 1 : 0
  const sessionProgress = inSession && jobs.length > 0 ? Math.round((currentIndex / jobs.length) * 100) : 0

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 max-w-3xl sm:flex-row sm:items-start sm:gap-4">
        <PageSymbol icon={Compass} className="sm:mt-0.5" />
        <div className="space-y-3 flex-1 min-w-0">
          <div>
            <p className="font-body text-[11px] font-medium uppercase tracking-wide text-[#86868b] mb-1">
              Browse roles
            </p>
            <h1 className="font-heading font-semibold text-3xl tracking-tight text-foreground sm:text-[34px] sm:leading-[1.1]">
              Discover
            </h1>
          </div>
          <p className="font-body text-[15px] leading-relaxed text-neutral-600">
          {noJobsAvailable ? (
            <>
              Nothing new in your queue right now. We show active roles from{" "}
              <span className="text-neutral-800 font-medium">verified employers</span> you haven&apos;t reviewed yet.
            </>
          ) : remaining > 0 ? (
            <>
              One card at a time, full context on the right.{" "}
              <span className="text-neutral-800 font-medium">Apply</span> shares your profile with that recruiter;{" "}
              <span className="text-neutral-800 font-medium">Save</span> bookmarks for later;{" "}
              <span className="text-neutral-800 font-medium">Pass</span> hides the role from this feed only.
            </>
          ) : (
            <>
              You&apos;ve cleared this batch. Refresh to pull the newest listings—still capped so the feed stays
              manageable.
            </>
          )}
        </p>
        </div>
      </header>

      {inSession && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div>
              <p className="font-body text-sm font-semibold text-foreground tracking-tight">
                Session · Card {sessionPosition} of {jobs.length}
              </p>
              <p className="font-body text-xs text-neutral-500 mt-0.5">
                Up to 20 roles per load, newest first. Pass doesn&apos;t notify anyone.
              </p>
            </div>
            {feedLoadedAt && (
              <p className="font-body text-xs text-neutral-400 tabular-nums sm:text-right shrink-0">
                Feed loaded {formatDistanceToNow(feedLoadedAt, { addSuffix: true })}
              </p>
            )}
          </div>
          <div
            className="h-1.5 rounded-full bg-neutral-100 overflow-hidden"
            role="progressbar"
            aria-valuenow={sessionProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progress through this batch"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
              style={{ width: `${sessionProgress}%` }}
            />
          </div>
        </div>
      )}

      <details className="group rounded-[22px] border border-[rgba(60,60,67,0.12)] bg-white/70 open:bg-white open:shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-xl backdrop-saturate-180 transition-all">
        <summary className="cursor-pointer list-none px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between gap-3 font-body text-[15px] font-semibold text-foreground tracking-tight [&::-webkit-details-marker]:hidden">
          <span>How this feed works</span>
          <span className="text-primary text-[13px] font-medium group-open:hidden">Show</span>
          <span className="text-primary text-[13px] font-medium hidden group-open:inline">Hide</span>
        </summary>
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 border-t border-[rgba(60,60,67,0.08)] space-y-4">
          <div className="pt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1.5">
                What you&apos;re seeing
              </p>
              <p className="font-body text-sm text-neutral-600 leading-relaxed">
                Active jobs only, from teams that have passed a basic review. We exclude roles you&apos;ve already
                swiped on so you don&apos;t duplicate decisions.
              </p>
            </div>
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1.5">
                What happens when you apply
              </p>
              <p className="font-body text-sm text-neutral-600 leading-relaxed">
                The employer can view the profile you&apos;ve built here (bio, skills, education, links). Messaging
                unlocks only after a <span className="font-medium text-neutral-800">mutual match</span>—check{" "}
                <Link href="/matches" className="text-primary font-medium hover:opacity-80">
                  Matches
                </Link>
                .
              </p>
            </div>
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1.5">
                Save &amp; pass
              </p>
              <p className="font-body text-sm text-neutral-600 leading-relaxed">
                Saved roles live in{" "}
                <Link href="/saved" className="text-primary font-medium hover:opacity-80">
                  Saved
                </Link>
                . Pass simply moves you forward; you can still open a{" "}
                <span className="font-medium text-neutral-800">full listing</span> from the detail panel if you want
                the long read before you decide.
              </p>
            </div>
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1.5">
                Timing
              </p>
              <p className="font-body text-sm text-neutral-600 leading-relaxed">
                Recruiters respond on different schedules. If you applied, give them a few days; nudges and outcomes
                will show up in Matches and notifications when we have them.
              </p>
            </div>
          </div>
        </div>
      </details>

      <div>
        <p className="font-body text-xs text-neutral-500 mb-2">Your numbers (all time)</p>
        <div className="grid grid-cols-3 gap-px rounded-[22px] bg-[rgba(60,60,67,0.1)] overflow-hidden border border-[rgba(60,60,67,0.12)] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          {[
            { label: "Applied", value: stats.applied, hint: "Interest sent" },
            { label: "Saved", value: stats.saved, hint: "Bookmarked" },
            { label: "Matches", value: stats.matches, hint: "Mutual" },
          ].map(({ label, value, hint }) => (
            <div key={label} className="bg-white px-4 py-4 text-center sm:text-left" title={hint}>
              <p className="font-heading text-2xl font-semibold tabular-nums text-foreground tracking-tight">{value}</p>
              <p className="font-body text-[11px] text-[#86868b] mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {currentIndex >= jobs.length ? (
        noJobsAvailable ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50/50 px-8 py-16 text-center">
            <h3 className="font-heading text-xl font-semibold text-neutral-950">Your queue is empty</h3>
            <p className="font-body text-sm text-neutral-600 mt-2 max-w-md mx-auto leading-relaxed">
              Either every active, verified listing is already in your history, or employers haven&apos;t posted new
              roles yet. Saved jobs stay in{" "}
              <Link href="/saved" className="text-primary font-medium hover:opacity-80">
                Saved
              </Link>
              .
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
          <div className="flex flex-col items-center gap-6 text-center py-12 rounded-[22px] border border-[rgba(60,60,67,0.12)] bg-white px-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <div className="h-px w-12 bg-[rgba(60,60,67,0.15)]" aria-hidden />
            <div>
              <h3 className="font-heading text-xl font-semibold text-foreground tracking-tight">Nice—batch finished</h3>
              <p className="font-body text-sm text-neutral-600 mt-2 max-w-md mx-auto leading-relaxed">
                You&apos;ve reviewed every role in this load. Hit refresh for up to 20 more (still excluding ones
                you&apos;ve already swiped). Check{" "}
                <Link href="/matches" className="text-primary font-medium hover:opacity-80">
                  Matches
                </Link>{" "}
                for replies.
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-6 w-full max-w-md text-left px-6 sm:px-0">
              <div>
                <dt className="font-body text-xs text-[#86868b]">Applied</dt>
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
              className="rounded-full bg-primary px-7 py-3 font-body text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(0,113,227,0.35)] transition hover:bg-[#0077ed] active:scale-[0.98]"
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
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border border-[rgba(60,60,67,0.18)] bg-white text-[#86868b] shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:bg-[#f5f5f7] active:scale-[0.97] disabled:opacity-50"
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
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary text-white transition hover:bg-[var(--clearpath-navy-hover)] active:scale-[0.97] disabled:opacity-50"
              >
                <Heart className="h-5 w-5 sm:h-6 sm:w-6 mx-auto" fill="currentColor" stroke="currentColor" strokeWidth={1.5} />
              </button>
            </div>
            <p className="font-body text-xs text-neutral-500 text-center max-w-[18rem] leading-relaxed">
              Drag the card left or right, or tap below. Order is newest-first; skipping doesn&apos;t tell the employer.
            </p>
          </div>

          {/* Right: job detail panel */}
          <div className="space-y-6">
            <article className="rounded-[22px] bg-white border border-[rgba(60,60,67,0.12)] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
              <div className="h-[7.5rem] apple-vibrancy-header flex items-end px-6 pb-5">
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
                <div className="flex flex-wrap items-center gap-2">
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
                  <span className="font-body text-xs text-neutral-400">
                    Listed {formatDate(currentJob.created_at)}
                  </span>
                </div>

                <p className="font-body text-xs text-neutral-500 -mt-2">
                  <Link
                    href={`/jobs/${currentJob.id}`}
                    className="font-medium text-neutral-800 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-950"
                  >
                    Open full listing
                  </Link>
                  <span className="text-neutral-400"> · shareable page, same actions</span>
                </p>

                <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 px-3.5 py-3">
                  <p className="font-body text-xs font-semibold text-amber-950/90 mb-1">Before you apply</p>
                  <ul className="font-body text-[12px] text-[#48484a] space-y-1 list-disc list-inside leading-relaxed">
                    <li>This recruiter can see your profile and application as soon as you tap Apply.</li>
                    <li>You won&apos;t be able to undo Apply here—pass if you&apos;re unsure.</li>
                  </ul>
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

                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 pt-4 border-t border-[rgba(60,60,67,0.08)]">
                  <button
                    type="button"
                    onClick={() => handleSwipe("left")}
                    disabled={swiping}
                    className="flex-1 rounded-[14px] border border-[rgba(60,60,67,0.18)] py-3.5 font-body text-[15px] font-semibold text-primary bg-[#f5f5f7]/80 transition hover:bg-[#e8e8ed] disabled:opacity-50"
                  >
                    Pass
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwipe("saved")}
                    disabled={swiping}
                    className="flex-1 rounded-[14px] border border-[rgba(60,60,67,0.18)] py-3.5 font-body text-[15px] font-semibold text-foreground bg-white transition hover:bg-[#f5f5f7] disabled:opacity-50 sm:max-w-[8rem]"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwipe("right")}
                    disabled={swiping}
                    className="flex-1 rounded-[14px] bg-primary py-3.5 font-body text-[15px] font-semibold text-primary-foreground transition hover:bg-[var(--clearpath-navy-hover)] active:scale-[0.99] disabled:opacity-50"
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

            <div className="rounded-[22px] border border-[rgba(60,60,67,0.12)] bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
              <h3 className="font-body text-[11px] font-semibold uppercase tracking-wide text-[#86868b] mb-2">
                Queue
              </h3>
              <p className="font-body text-sm text-neutral-600 leading-relaxed">
                {remaining > 1
                  ? `${remaining - 1} more role${remaining - 1 === 1 ? "" : "s"} in this batch after this one. Finish the stack or refresh anytime for a new slice.`
                  : "Last role in this batch—your next tap completes the set."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
