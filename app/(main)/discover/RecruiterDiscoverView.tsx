"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { SwipeCard } from "@/components/swipe/SwipeCard"
import { CandidateCard } from "@/components/swipe/CandidateCard"
import { useToast } from "@/lib/hooks/use-toast"
import Link from "next/link"
import { X, Heart, CheckCircle } from "lucide-react"
import { DiscoverHeader, DiscoverStatStrip, DiscoverLoading } from "@/components/discover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getInitials } from "@/lib/utils"
import type { Profile, StudentProfile } from "@/types"

interface Candidate {
  profile: Profile
  studentProfile: StudentProfile
}

interface Job {
  id: string
  title: string
  job_type: string
}

interface Stats {
  liked: number
  passed: number
  total: number
}

type SwipeRow = { student_id: string; direction: string }
type StudentProfileRow = StudentProfile & { profiles: Profile; id: string }

export function RecruiterDiscoverView({ userId }: { userId: string }) {
  const { toast } = useToast()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [swiping, setSwiping] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string>("")
  const [stats, setStats] = useState<Stats>({ liked: 0, passed: 0, total: 0 })

  async function loadCandidates(jobId: string) {
    setLoading(true)
    const supabase = createClient()
    const { data: swipedIds } = await supabase
      .from("candidate_swipes")
      .select("student_id, direction")
      .eq("recruiter_id", userId)
      .eq("job_id", jobId)
    const swiped = (swipedIds || []).map((s: SwipeRow) => s.student_id)
    const liked  = (swipedIds || []).filter((s: SwipeRow) => s.direction === "right").length
    const passed = (swipedIds || []).filter((s: SwipeRow) => s.direction === "left").length
    setStats({ liked, passed, total: swiped.length })

    const { data } = await supabase
      .from("student_profiles")
      .select("*, profiles!inner(*)")
      .limit(30)
    const filtered = (data || []).filter((sp: StudentProfileRow) => !swiped.includes(sp.id))
    setCandidates(filtered.map((sp: StudentProfileRow) => ({ profile: sp.profiles as Profile, studentProfile: sp as StudentProfile })))
    setCurrentIndex(0)
    setLoading(false)
  }

  async function loadInitialData() {
    const supabase = createClient()
    const { data: jobsData } = await supabase
      .from("jobs")
      .select("id, title, job_type")
      .eq("recruiter_id", userId)
      .eq("is_active", true)
    setJobs((jobsData as Job[]) || [])
    if (jobsData?.[0]) {
      setSelectedJobId(jobsData[0].id)
      await loadCandidates(jobsData[0].id)
    } else {
      setLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadInitialData()
    })
  }, [])

  const handleSwipe = useCallback(async (direction: "right" | "left") => {
    if (!selectedJobId || swiping || currentIndex >= candidates.length) return
    const candidate = candidates[currentIndex]
    setSwiping(true)
    const supabase = createClient()
    await supabase.from("candidate_swipes").insert({
      recruiter_id: userId,
      student_id: candidate.profile.id,
      job_id: selectedJobId,
      direction,
    })
    if (direction === "right") {
      toast({ title: "Liked!", description: `You liked ${candidate.profile.full_name}` })
      setStats(prev => ({ ...prev, liked: prev.liked + 1, total: prev.total + 1 }))
    } else {
      setStats(prev => ({ ...prev, passed: prev.passed + 1, total: prev.total + 1 }))
    }
    setCurrentIndex(prev => prev + 1)
    setTimeout(() => setSwiping(false), 100)
  }, [userId, selectedJobId, swiping, currentIndex, candidates, toast])

  const currentCandidate = candidates[currentIndex]
  const nextCandidate    = candidates[currentIndex + 1]
  const remaining        = candidates.length - currentIndex

  if (loading) {
    return <DiscoverLoading label="Loading candidates…" />
  }

  if (jobs.length === 0) {
    return (
      <div className="space-y-10">
        <DiscoverHeader
          eyebrow="Talent"
          title="Discover"
          description="Review candidates in the context of each role you have open."
        />
        <Card className="border-dashed bg-muted/15 py-12 text-center shadow-none sm:py-16">
          <CardHeader className="space-y-2">
            <CardTitle className="font-heading text-lg">No active listings</CardTitle>
            <CardDescription className="mx-auto max-w-sm text-base">
              Publish a role to start browsing candidates for that position.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="mt-2 rounded-full">
              <Link href="/jobs/new">Post a job</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedJob = jobs.find(j => j.id === selectedJobId)

  return (
    <div className="space-y-10">
      <DiscoverHeader
        eyebrow="Talent"
        title="Discover"
        description={
          <>
            {remaining > 0
              ? `${remaining} candidate${remaining === 1 ? "" : "s"} left for this role`
              : "You're through this list for now."}
            {selectedJob ? (
              <span className="mt-1 block font-medium text-foreground sm:mt-0 sm:inline sm:before:content-['\00a0·\00a0']">
                {selectedJob.title}
              </span>
            ) : null}
          </>
        }
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[min(100%,18rem)]">
            <Label htmlFor="discover-job" className="font-data text-[10px] uppercase tracking-wide text-muted-foreground">
              Active posting
            </Label>
            <Select
              value={selectedJobId}
              onValueChange={(value) => {
                setSelectedJobId(value)
                void loadCandidates(value)
              }}
            >
              <SelectTrigger id="discover-job" className="h-11 rounded-xl">
                <SelectValue placeholder="Select a job" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <DiscoverStatStrip
        caption="This role (session)"
        items={[
          { label: "Liked", value: stats.liked, hint: "Right swipes" },
          { label: "Passed", value: stats.passed, hint: "Left swipes" },
          { label: "Reviewed", value: stats.total, hint: "Total decisions" },
        ]}
      />

      {currentIndex >= candidates.length ? (
        <Card className="py-10 text-center shadow-md sm:py-12">
          <CardContent className="space-y-6">
            <CheckCircle className="mx-auto h-10 w-10 text-muted-foreground/60" strokeWidth={1.25} aria-hidden />
            <div className="space-y-2">
              <h3 className="font-heading text-xl font-semibold text-foreground">List complete</h3>
              <p className="mx-auto max-w-sm font-body text-sm leading-relaxed text-muted-foreground">
                You&apos;ve reviewed {stats.total} candidate{stats.total !== 1 ? "s" : ""} for this role. Refresh to reload
                the pool.
              </p>
            </div>
            <dl className="mx-auto grid max-w-xs grid-cols-2 gap-4 text-left">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <dt className="font-body text-xs text-muted-foreground">Liked</dt>
                <dd className="font-heading mt-1 text-xl font-semibold tabular-nums text-foreground">{stats.liked}</dd>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <dt className="font-body text-xs text-muted-foreground">Passed</dt>
                <dd className="font-heading mt-1 text-xl font-semibold tabular-nums text-foreground">{stats.passed}</dd>
              </div>
            </dl>
            <Button type="button" className="rounded-full" variant="default" onClick={() => void loadCandidates(selectedJobId)}>
              Refresh list
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-10">
          <div className="flex flex-col items-center gap-6 lg:sticky lg:top-6">
            <div className="relative mx-auto w-full max-w-sm">
              {nextCandidate ? (
                <div className="pointer-events-none absolute inset-0 -translate-y-3 scale-[0.96] overflow-hidden rounded-2xl opacity-50">
                  <CandidateCard profile={nextCandidate.profile} studentProfile={nextCandidate.studentProfile} />
                </div>
              ) : null}
              <SwipeCard
                key={currentCandidate.profile.id}
                onSwipeLeft={() => handleSwipe("left")}
                onSwipeRight={() => handleSwipe("right")}
                disabled={swiping}
                rightStampLabel="Like"
              >
                <CandidateCard profile={currentCandidate.profile} studentProfile={currentCandidate.studentProfile} />
              </SwipeCard>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => handleSwipe("left")}
                disabled={swiping}
                aria-label="Pass on this candidate"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted active:scale-[0.97] disabled:opacity-50 sm:h-14 sm:w-14"
              >
                <X className="mx-auto h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => handleSwipe("right")}
                disabled={swiping}
                aria-label="Like this candidate"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition hover:bg-[var(--clearpath-navy-hover)] active:scale-[0.97] disabled:opacity-50 sm:h-14 sm:w-14"
              >
                <Heart className="mx-auto h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" stroke="currentColor" strokeWidth={1.5} />
              </button>
            </div>

            <p className="text-center font-body text-xs text-muted-foreground">Swipe the card or use the actions below</p>
          </div>

          <div className="min-w-0 space-y-6">
            <Card className="overflow-hidden shadow-lg ring-1 ring-black/[0.04]">
              <div className="apple-vibrancy-header flex h-28 items-end px-6 pb-5">
                <div className="flex items-end gap-4 min-w-0">
                  <Avatar className="h-14 w-14 ring-2 ring-white/15 shrink-0">
                    <AvatarImage src={currentCandidate.profile.avatar_url || undefined} />
                    <AvatarFallback className="text-base font-semibold bg-white/10 text-white">
                      {getInitials(currentCandidate.profile.full_name || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 pb-0.5">
                    <h2 className="font-heading font-semibold text-lg sm:text-xl text-white leading-snug tracking-tight truncate">
                      {currentCandidate.profile.full_name}
                    </h2>
                    {(currentCandidate.studentProfile.university || currentCandidate.studentProfile.degree) && (
                      <p className="font-body text-sm text-white/65 mt-1 truncate">
                        {[currentCandidate.studentProfile.university, currentCandidate.studentProfile.degree]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    {currentCandidate.studentProfile.graduation_year && (
                      <p className="font-body text-xs text-white/50 mt-0.5">
                        Class of {currentCandidate.studentProfile.graduation_year}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <CardContent className="space-y-6 p-6 sm:p-8">
                {currentCandidate.profile.profile_video_url ? (
                  <div className="aspect-video max-h-[240px] overflow-hidden rounded-xl bg-muted ring-1 ring-border">
                    <video
                      src={currentCandidate.profile.profile_video_url}
                      controls
                      className="h-full w-full object-contain"
                      playsInline
                    />
                  </div>
                ) : null}
                {currentCandidate.profile.bio ? (
                  <div>
                    <h3 className="mb-2 font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      About
                    </h3>
                    <p className="font-body text-sm leading-relaxed text-foreground">{currentCandidate.profile.bio}</p>
                  </div>
                ) : null}

                {currentCandidate.studentProfile.skills && currentCandidate.studentProfile.skills.length > 0 ? (
                  <div>
                    <h3 className="mb-2 font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentCandidate.studentProfile.skills.map((s: string) => (
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

                {currentCandidate.studentProfile.preferred_job_categories &&
                currentCandidate.studentProfile.preferred_job_categories.length > 0 ? (
                  <div>
                    <h3 className="mb-2 font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Interested in
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentCandidate.studentProfile.preferred_job_categories.map((c: string) => (
                        <span
                          key={c}
                          className="rounded-md border border-border bg-background px-2.5 py-1 font-body text-xs text-muted-foreground"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
                  {currentCandidate.studentProfile.linkedin_url ? (
                    <a
                      href={currentCandidate.studentProfile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      LinkedIn
                    </a>
                  ) : null}
                  {currentCandidate.studentProfile.github_url ? (
                    <a
                      href={currentCandidate.studentProfile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      GitHub
                    </a>
                  ) : null}
                  {currentCandidate.studentProfile.portfolio_url ? (
                    <a
                      href={currentCandidate.studentProfile.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Portfolio
                    </a>
                  ) : null}
                  {currentCandidate.studentProfile.resume_url ? (
                    <a
                      href={currentCandidate.studentProfile.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Resume
                    </a>
                  ) : null}
                </div>

                <Separator />

                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 flex-1 rounded-xl"
                    onClick={() => handleSwipe("left")}
                    disabled={swiping}
                  >
                    Pass
                  </Button>
                  <Button type="button" className="h-12 flex-1 rounded-xl" onClick={() => handleSwipe("right")} disabled={swiping}>
                    Like
                  </Button>
                </div>
              </CardContent>
            </Card>

            {candidates.slice(currentIndex + 1, currentIndex + 4).length > 0 ? (
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Up next
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 pt-0">
                  <ul className="space-y-1">
                    {candidates.slice(currentIndex + 1, currentIndex + 4).map(({ profile, studentProfile }, i) => (
                      <li key={profile.id} className="flex items-center gap-3 rounded-xl py-2.5">
                        <Avatar className="h-9 w-9 shrink-0 ring-1 ring-border">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback className="bg-muted text-xs text-foreground">
                            {getInitials(profile.full_name || "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-body text-sm font-medium text-foreground">{profile.full_name}</p>
                          <p className="truncate font-body text-xs text-muted-foreground">
                            {studentProfile.university ?? "Student"}
                          </p>
                        </div>
                        <span className="shrink-0 font-body text-xs tabular-nums text-muted-foreground">{i + 2}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-dashed bg-muted/20 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  How it works
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ol className="list-inside list-decimal space-y-2 font-body text-sm leading-relaxed text-muted-foreground">
                  <li>Liking signals interest in a candidate&apos;s profile.</li>
                  <li>If they applied to your role and you both align, it&apos;s a match.</li>
                  <li>Matches open a private thread to schedule interviews.</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
