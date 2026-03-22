"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { SwipeCard } from "@/components/swipe/SwipeCard"
import { JobCard } from "@/components/swipe/JobCard"
import { useToast } from "@/lib/hooks/use-toast"
import { X, Heart, Bookmark, Building2, Send } from "lucide-react"
import {
  DiscoverHeader,
  DiscoverStatStrip,
  DiscoverSessionProgress,
  DiscoverLoading,
  DiscoverHowItWorks,
} from "@/components/discover"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
    return <DiscoverLoading label="Loading roles…" />
  }

  const company = currentJob?.recruiter_profiles ?? null

  const noJobsAvailable = jobs.length === 0
  const inSession = !noJobsAvailable && currentIndex < jobs.length
  const sessionPosition = inSession ? currentIndex + 1 : 0

  return (
    <div className="space-y-10">
      <DiscoverHeader
        eyebrow="Browse roles"
        title="Discover"
        description={
          <>
            {noJobsAvailable ? (
              <>
                Nothing new in your queue right now. We show active roles from{" "}
                <span className="font-medium text-foreground">verified employers</span> you haven&apos;t reviewed yet.
              </>
            ) : remaining > 0 ? (
              <>
                One card at a time, full context on the right.{" "}
                <span className="font-medium text-foreground">Apply</span> shares your profile with that recruiter;{" "}
                <span className="font-medium text-foreground">Save</span> bookmarks for later;{" "}
                <span className="font-medium text-foreground">Pass</span> hides the role from this feed only.
              </>
            ) : (
              <>
                You&apos;ve cleared this batch. Refresh to pull the newest listings—still capped so the feed stays
                manageable.
              </>
            )}
          </>
        }
      />

      {inSession ? (
        <DiscoverSessionProgress position={sessionPosition} total={jobs.length} loadedAt={feedLoadedAt} />
      ) : null}

      <DiscoverStatStrip
        caption="Your numbers (all time)"
        items={[
          { label: "Applied", value: stats.applied, hint: "Interest sent", icon: Send },
          { label: "Saved", value: stats.saved, hint: "Bookmarked", icon: Bookmark },
          { label: "Matches", value: stats.matches, hint: "Mutual", icon: Heart },
        ]}
      />

      <DiscoverHowItWorks />

      {currentIndex >= jobs.length ? (
        noJobsAvailable ? (
          <Card className="border-dashed bg-muted/15 py-12 text-center shadow-none sm:py-16">
            <CardHeader className="space-y-2">
              <CardTitle className="font-heading text-xl">Your queue is empty</CardTitle>
              <CardDescription className="max-w-md text-pretty mx-auto text-base leading-relaxed">
                Either every active, verified listing is already in your history, or employers haven&apos;t posted new
                roles yet. Saved jobs stay in{" "}
                <Link href="/saved" className="font-medium text-primary underline-offset-4 hover:underline">
                  Saved
                </Link>
                .
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" variant="secondary" className="mt-2 rounded-full" onClick={() => void loadJobs()}>
                Check again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden py-10 text-center shadow-md sm:py-12">
            <CardContent className="space-y-8">
              <div className="mx-auto h-px w-14 bg-border" aria-hidden />
              <div className="space-y-2">
                <h3 className="font-heading text-xl font-semibold tracking-tight text-foreground">Batch complete</h3>
                <p className="mx-auto max-w-md font-body text-sm leading-relaxed text-muted-foreground">
                  You&apos;ve reviewed every role in this load. Refresh for up to 20 more (excluding roles you&apos;ve
                  already swiped). Check{" "}
                  <Link href="/matches" className="font-medium text-primary underline-offset-4 hover:underline">
                    Matches
                  </Link>{" "}
                  for replies.
                </p>
              </div>
              <dl className="mx-auto grid max-w-md grid-cols-3 gap-6 px-4 text-left">
                <div>
                  <dt className="font-body text-xs text-muted-foreground">Applied</dt>
                  <dd className="font-heading mt-0.5 text-lg font-semibold tabular-nums text-foreground">{stats.applied}</dd>
                </div>
                <div>
                  <dt className="font-body text-xs text-muted-foreground">Saved</dt>
                  <dd className="font-heading mt-0.5 text-lg font-semibold tabular-nums text-foreground">{stats.saved}</dd>
                </div>
                <div>
                  <dt className="font-body text-xs text-muted-foreground">Matches</dt>
                  <dd className="font-heading mt-0.5 text-lg font-semibold tabular-nums text-foreground">{stats.matches}</dd>
                </div>
              </dl>
              <Button type="button" className="rounded-full px-8" onClick={() => void loadJobs()}>
                Refresh feed
              </Button>
            </CardContent>
          </Card>
        )
      ) : (
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-10">
          <div className="flex flex-col items-center gap-6 lg:sticky lg:top-6">
            <div className="relative mx-auto w-full max-w-sm">
              {nextJob ? (
                <div className="pointer-events-none absolute inset-0 -translate-y-3 scale-[0.96] overflow-hidden rounded-2xl opacity-55">
                  <JobCard job={nextJob} />
                </div>
              ) : null}
              <SwipeCard
                key={currentJob.id}
                onSwipeLeft={() => handleSwipe("left")}
                onSwipeRight={() => handleSwipe("right")}
                disabled={swiping}
              >
                <JobCard job={currentJob} />
              </SwipeCard>
            </div>

            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => handleSwipe("left")}
                disabled={swiping}
                aria-label="Pass on this role"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted active:scale-[0.97] disabled:opacity-50 sm:h-14 sm:w-14"
              >
                <X className="mx-auto h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => handleSwipe("saved")}
                disabled={swiping}
                aria-label="Save for later"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:bg-muted active:scale-[0.97] disabled:opacity-50 sm:h-12 sm:w-12"
              >
                <Bookmark className="mx-auto h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => handleSwipe("right")}
                disabled={swiping}
                aria-label="Apply to this role"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition hover:bg-[var(--clearpath-navy-hover)] active:scale-[0.97] disabled:opacity-50 sm:h-14 sm:w-14"
              >
                <Heart className="mx-auto h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" stroke="currentColor" strokeWidth={1.5} />
              </button>
            </div>
            <p className="max-w-[18rem] text-center font-body text-xs leading-relaxed text-muted-foreground">
              Drag the card or tap an action. Newest first; passing doesn&apos;t notify the employer.
            </p>
          </div>

          <div className="min-w-0 space-y-6">
            <Card className="overflow-hidden shadow-lg ring-1 ring-black/[0.04]">
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

              <CardContent className="space-y-6 p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="font-normal">
                    {JOB_TYPE_LABEL[currentJob.job_type] ?? currentJob.job_type}
                  </Badge>
                  {currentJob.is_remote ? (
                    <Badge variant="outline" className="font-normal text-muted-foreground">
                      Remote
                    </Badge>
                  ) : currentJob.location ? (
                    <Badge variant="outline" className="font-normal text-muted-foreground">
                      {currentJob.location}
                    </Badge>
                  ) : null}
                  <span className="font-body text-xs text-muted-foreground">
                    Listed {formatDate(currentJob.created_at)}
                  </span>
                </div>

                <p className="-mt-1 font-body text-xs text-muted-foreground">
                  <Link
                    href={`/jobs/${currentJob.id}`}
                    className="font-medium text-foreground underline decoration-border underline-offset-2 hover:decoration-primary"
                  >
                    Open full listing
                  </Link>
                  <span className="text-muted-foreground"> · same page, same actions</span>
                </p>

                <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 px-3.5 py-3 dark:bg-amber-950/20">
                  <p className="mb-1 font-body text-xs font-semibold text-amber-950 dark:text-amber-100">Before you apply</p>
                  <ul className="list-inside list-disc space-y-1 font-body text-[12px] leading-relaxed text-amber-950/90 dark:text-amber-50/90">
                    <li>This recruiter can see your profile as soon as you apply.</li>
                    <li>You can&apos;t undo Apply here—pass if you&apos;re unsure.</li>
                  </ul>
                </div>

                {currentJob.description ? (
                  <div>
                    <h3 className="mb-2 font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Role
                    </h3>
                    <p className="font-body text-sm leading-relaxed text-foreground">{currentJob.description}</p>
                  </div>
                ) : null}

                {(currentJob.required_skills?.length ?? 0) > 0 ? (
                  <div>
                    <h3 className="mb-2 font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Required
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentJob.required_skills.map((s) => (
                        <span
                          key={s}
                          className="rounded-md border border-border bg-muted/50 px-2.5 py-1 font-body text-xs text-foreground"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {(currentJob.nice_to_have_skills?.length ?? 0) > 0 ? (
                  <div>
                    <h3 className="mb-2 font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Nice to have
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentJob.nice_to_have_skills.map((s) => (
                        <span
                          key={s}
                          className="rounded-md border border-border bg-background px-2.5 py-1 font-body text-xs text-muted-foreground"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {company?.description ? (
                  <div>
                    <h3 className="mb-2 font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {company.company_name ? `About ${company.company_name}` : "Company"}
                    </h3>
                    <p className="font-body text-sm leading-relaxed text-foreground">{company.description}</p>
                  </div>
                ) : null}

                {company?.website_url ? (
                  <a
                    href={company.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block font-body text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Company website
                  </a>
                ) : null}

                <Separator />

                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 flex-1 rounded-xl text-[15px] font-semibold"
                    onClick={() => handleSwipe("left")}
                    disabled={swiping}
                  >
                    Pass
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-12 flex-1 rounded-xl text-[15px] font-semibold sm:max-w-[8rem]"
                    onClick={() => handleSwipe("saved")}
                    disabled={swiping}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    className="h-12 flex-1 rounded-xl text-[15px] font-semibold"
                    onClick={() => handleSwipe("right")}
                    disabled={swiping}
                  >
                    Apply
                  </Button>
                </div>
              </CardContent>
            </Card>

            {jobs.slice(currentIndex + 1, currentIndex + 4).length > 0 ? (
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Up next
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 pt-0">
                  <ul className="space-y-1">
                    {jobs.slice(currentIndex + 1, currentIndex + 4).map((job, i) => {
                      const co = job.recruiter_profiles
                      return (
                        <li
                          key={job.id}
                          className="flex items-center gap-3 rounded-xl px-1 py-2.5 text-muted-foreground"
                        >
                          {co?.logo_url ? (
                            <img
                              src={co.logo_url}
                              alt=""
                              className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-border"
                            />
                          ) : (
                            <div className="h-9 w-9 shrink-0 rounded-lg bg-muted" aria-hidden />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-body text-sm font-medium text-foreground">{job.title}</p>
                            <p className="truncate font-body text-xs text-muted-foreground">{co?.company_name ?? "Company"}</p>
                          </div>
                          <span className="shrink-0 font-body text-xs tabular-nums text-muted-foreground">{i + 2}</span>
                        </li>
                      )
                    })}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-dashed bg-muted/20 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="font-data text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Queue
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="font-body text-sm leading-relaxed text-muted-foreground">
                  {remaining > 1
                    ? `${remaining - 1} more role${remaining - 1 === 1 ? "" : "s"} in this batch after this one. Finish the stack or refresh for a new slice.`
                    : "Last role in this batch—your next action completes the set."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
