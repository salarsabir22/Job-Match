"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { SwipeCard } from "@/components/swipe/SwipeCard"
import { JobCard } from "@/components/swipe/JobCard"
import { ConfettiBurst } from "@/components/motion/ConfettiBurst"
import {
  DiscoverHeader,
  DiscoverHowItWorks,
  DiscoverLoading,
} from "@/components/discover"
import { DiscoverFilterSheet } from "@/components/discover/DiscoverFilterSheet"
import { MatchModal } from "@/components/match/MatchModal"
import { recordJobView, notifyApplicationMilestone } from "@/lib/engagement"
import { whyThisJob } from "@/lib/match/fit"
import { JOB_CATEGORIES } from "@/lib/company-options"
import { X, Check, RotateCcw, Bookmark, RefreshCw } from "lucide-react"
import type { Job, SwipeDirection } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { undoJobSwipe } from "@/lib/swipe/undo"
import { getBlockedPeerIds } from "@/lib/moderation/blocks"
import { useToast } from "@/lib/hooks/use-toast"

type JobSwipeRow = { job_id: string; direction: string }
type LastSwipe = { job: Job; direction: SwipeDirection }

function conversationHref(match: { id: string; conversations?: { id: string }[] | { id: string } | null }) {
  const conv = Array.isArray(match.conversations) ? match.conversations[0] : match.conversations
  return conv?.id ? `/chat/${conv.id}` : `/chat/${match.id}`
}

export function StudentDiscoverView({
  userId,
  skills,
  preferredCategories,
  selfImageUrl,
  selfName = "You",
}: {
  userId: string
  skills?: string[] | null
  preferredCategories?: string[] | null
  selfImageUrl?: string | null
  selfName?: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [allJobs, setAllJobs] = useState<Job[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [swiping, setSwiping] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const [lastSwipe, setLastSwipe] = useState<LastSwipe | null>(null)
  const [loadedAt, setLoadedAt] = useState<Date | null>(null)
  const [sessionApplied, setSessionApplied] = useState(0)
  const [sessionSaved, setSessionSaved] = useState(0)
  const [jobType, setJobType] = useState("all")
  const [remote, setRemote] = useState("all")
  const [category, setCategory] = useState("all")
  const [location, setLocation] = useState("")
  const [matchOpen, setMatchOpen] = useState(false)
  const [matchName, setMatchName] = useState("")
  const [matchHref, setMatchHref] = useState<string | null>(null)
  const [matchImage, setMatchImage] = useState<string | null>(null)

  const jobs = useMemo(() => {
    const loc = location.trim().toLowerCase()
    return allJobs.filter((job) => {
      if (jobType !== "all" && job.job_type !== jobType) return false
      if (remote === "remote" && !job.is_remote) return false
      if (remote === "onsite" && job.is_remote) return false
      if (category !== "all" && (job.category || "") !== category) return false
      if (loc && !(job.location || "").toLowerCase().includes(loc) && !job.is_remote) return false
      return true
    })
  }, [allJobs, jobType, remote, category, location])

  async function loadJobs() {
    setLoading(true)
    const supabase = createClient()
    const [{ data: swipeRows }, blocked] = await Promise.all([
      supabase.from("job_swipes").select("job_id, direction").eq("student_id", userId),
      getBlockedPeerIds(supabase, userId),
    ])
    const swipedJobIds = ((swipeRows || []) as JobSwipeRow[]).map((s) => s.job_id)

    let query = supabase
      .from("jobs")
      .select("*, recruiter_profiles(id, company_name, logo_url, website_url, description, is_approved)")
      .eq("is_active", true)

    if (swipedJobIds.length > 0) {
      query = query.not("id", "in", `(${swipedJobIds.join(",")})`)
    }

    const { data } = await query.order("created_at", { ascending: false }).limit(40)
    const rows = ((data || []) as Job[]).filter(
      (j) => j.recruiter_profiles?.is_approved === true && !blocked.has(j.recruiter_id)
    )
    const prefs = (preferredCategories || []).map((c) => c.toLowerCase())
    rows.sort((a, b) => {
      const score = (job: Job) => {
        let n = whyThisJob({
          studentSkills: skills,
          preferredCategories,
          jobSkills: job.required_skills,
          jobCategory: job.category,
          remote: job.is_remote,
        }).length
        if (job.category && prefs.includes(job.category.toLowerCase())) n += 2
        return n
      }
      return score(b) - score(a)
    })
    setAllJobs(rows)
    setCurrentIndex(0)
    setLastSwipe(null)
    setSessionApplied(0)
    setSessionSaved(0)
    setLoadedAt(new Date())
    setLoading(false)
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadJobs()
    })
  }, [])

  useEffect(() => {
    setCurrentIndex(0)
  }, [jobType, remote, category, location])

  const currentJob = jobs[currentIndex]
  const nextJob = jobs[currentIndex + 1]
  const remaining = Math.max(jobs.length - currentIndex, 0)

  useEffect(() => {
    if (!currentJob?.id) return
    const recruiterId = currentJob.recruiter_id
    if (!recruiterId) return
    const supabase = createClient()
    void recordJobView(supabase, {
      studentId: userId,
      jobId: currentJob.id,
      recruiterId,
      jobTitle: currentJob.title,
    })
  }, [currentJob?.id, currentJob?.recruiter_id, currentJob?.title, userId])

  const handleSwipe = useCallback(
    async (direction: SwipeDirection) => {
      if (swiping || currentIndex >= jobs.length) return
      const job = jobs[currentIndex]
      setSwiping(true)
      const supabase = createClient()
      await supabase.from("job_swipes").insert({ student_id: userId, job_id: job.id, direction })
      setLastSwipe({ job, direction })

      if (direction === "right") {
        setSessionApplied((n) => n + 1)
        void notifyApplicationMilestone(supabase, {
          jobId: job.id,
          recruiterId: job.recruiter_id,
          jobTitle: job.title,
        })
        const { data: match } = await supabase
          .from("matches")
          .select("id, conversations(id)")
          .eq("student_id", userId)
          .eq("job_id", job.id)
          .maybeSingle()
        if (match?.id) {
          setMatchName(job.recruiter_profiles?.company_name || "the team")
          setMatchHref(conversationHref(match))
          setMatchImage(job.recruiter_profiles?.logo_url ?? null)
          setMatchOpen(true)
          setCelebrate(true)
          setTimeout(() => setCelebrate(false), 1200)
        }
      } else if (direction === "saved") {
        setSessionSaved((n) => n + 1)
      }

      setCurrentIndex((prev) => prev + 1)
      setTimeout(() => setSwiping(false), 100)
    },
    [userId, swiping, currentIndex, jobs]
  )

  const handleUndo = useCallback(async () => {
    if (swiping || !lastSwipe) return
    setSwiping(true)
    const supabase = createClient()
    const result = await undoJobSwipe(supabase, {
      studentId: userId,
      recruiterId: lastSwipe.job.recruiter_id,
      jobId: lastSwipe.job.id,
    })
    if (!result.ok) {
      toast({
        variant: "destructive",
        title: "Couldn’t undo",
        description: result.message ?? "Try again.",
      })
      setSwiping(false)
      return
    }
    if (lastSwipe.direction === "right") setSessionApplied((n) => Math.max(0, n - 1))
    if (lastSwipe.direction === "saved") setSessionSaved((n) => Math.max(0, n - 1))
    setLastSwipe(null)
    setCurrentIndex((prev) => Math.max(0, prev - 1))
    setTimeout(() => setSwiping(false), 100)
  }, [swiping, lastSwipe, userId, toast])

  const currentReasons = currentJob
    ? whyThisJob({
        studentSkills: skills,
        preferredCategories,
        jobSkills: currentJob.required_skills,
        jobCategory: currentJob.category,
        remote: currentJob.is_remote,
      })
    : []

  const filterCount =
    (jobType !== "all" ? 1 : 0) +
    (remote !== "all" ? 1 : 0) +
    (category !== "all" ? 1 : 0) +
    (location.trim() ? 1 : 0)

  const filters = (
    <DiscoverFilterSheet count={filterCount}>
      <Select value={jobType} onValueChange={setJobType}>
        <SelectTrigger className="rounded-full" aria-label="Job type">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="internship">Internship</SelectItem>
          <SelectItem value="full_time">Full-time</SelectItem>
          <SelectItem value="part_time">Part-time</SelectItem>
          <SelectItem value="contract">Contract</SelectItem>
        </SelectContent>
      </Select>
      <Select value={remote} onValueChange={setRemote}>
        <SelectTrigger className="rounded-full" aria-label="Remote">
          <SelectValue placeholder="Location type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Remote or on-site</SelectItem>
          <SelectItem value="remote">Remote</SelectItem>
          <SelectItem value="onsite">On-site</SelectItem>
        </SelectContent>
      </Select>
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="rounded-full" aria-label="Category">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {JOB_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        className="h-9 rounded-full"
        placeholder="City"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        aria-label="Filter by city"
      />
    </DiscoverFilterSheet>
  )

  const swipeChrome = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-heading text-xl font-semibold tracking-tight">Roles for you</h1>
        <p className="mt-0.5 font-body text-sm text-muted-foreground">
          {remaining} left{sessionApplied ? ` · ${sessionApplied} applied` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {filters}
        <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={() => void loadJobs()} aria-label="Refresh feed">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const emptyChrome = (
    <>
      <DiscoverHeader
        eyebrow="Discover"
        title="Roles for you"
        description="Swipe through live listings from verified teams. Apply, save, or pass — you can undo the last card."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {filters}
            <Button type="button" variant="outline" className="rounded-full" onClick={() => void loadJobs()}>
              Refresh feed
            </Button>
          </div>
        }
      />
    </>
  )

  if (loading) {
    return <DiscoverLoading label="Finding roles…" />
  }

  if (currentIndex >= jobs.length) {
    return (
      <div className="space-y-8">
        {emptyChrome}
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/40 px-4 py-16 text-center">
          <p className="font-heading text-xl font-semibold tracking-tight">
            {allJobs.length === 0 ? "No new roles right now" : jobs.length === 0 ? "Nothing matches these filters" : "That’s this batch"}
          </p>
          <p className="mt-2 max-w-sm font-body text-sm text-muted-foreground">
            {allJobs.length === 0
              ? "Verified teams haven’t posted anything you haven’t already seen. Refresh in a bit."
              : jobs.length === 0
                ? "Widen type, category, or city to see more of this stack."
                : "Pull a fresh stack whenever you’re ready, or undo the last swipe."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Button type="button" onClick={() => void loadJobs()}>
              Refresh feed
            </Button>
            {lastSwipe ? (
              <Button type="button" variant="outline" onClick={() => void handleUndo()} disabled={swiping}>
                <RotateCcw className="h-4 w-4" />
                Undo last swipe
              </Button>
            ) : null}
          </div>
        </div>
        <DiscoverHowItWorks audience="student" />
        <MatchModal
          open={matchOpen}
          onOpenChange={setMatchOpen}
          name={matchName}
          chatHref={matchHref}
          imageUrl={matchImage}
          selfImageUrl={selfImageUrl}
          selfName={selfName}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {swipeChrome}
      <ConfettiBurst show={celebrate} />

      <div className="flex flex-col items-center gap-4">
        <div className="relative mx-auto w-full max-w-[26rem] lg:max-w-[28rem]">
          {nextJob ? (
            <div className="pointer-events-none absolute inset-0 -translate-y-3 scale-[0.96] overflow-hidden rounded-3xl opacity-50">
              <JobCard job={nextJob} />
            </div>
          ) : null}
          <SwipeCard
            key={currentJob.id}
            onSwipeLeft={() => handleSwipe("left")}
            onSwipeRight={() => handleSwipe("right")}
            disabled={swiping}
            rightStampLabel="Apply"
            leftStampLabel="Pass"
          >
            <JobCard
              job={currentJob}
              reasons={currentReasons}
              onOpenCompany={() => router.push(`/company/${currentJob.recruiter_id}`)}
            />
          </SwipeCard>
        </div>

        <Button type="button" variant="link" onClick={() => router.push(`/jobs/${currentJob.id}`)}>
          Open full listing
        </Button>

        <div className="flex items-end justify-center gap-4 sm:gap-6">
          <div className="flex flex-col items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void handleUndo()}
              disabled={swiping || !lastSwipe}
              className="h-12 w-12 rounded-full"
              aria-label="Undo last swipe"
            >
              <RotateCcw className="h-5 w-5" strokeWidth={1.75} />
            </Button>
            <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Undo</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleSwipe("left")}
              disabled={swiping}
              className="h-14 w-14 rounded-full"
              aria-label="Pass"
            >
              <X className="h-6 w-6" strokeWidth={1.75} />
            </Button>
            <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Pass</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => handleSwipe("saved")}
              disabled={swiping}
              className="h-12 w-12 rounded-full"
              aria-label="Save for later"
            >
              <Bookmark className="h-5 w-5" strokeWidth={1.75} />
            </Button>
            <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Save</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Button
              type="button"
              size="icon"
              onClick={() => handleSwipe("right")}
              disabled={swiping}
              className="h-14 w-14 rounded-full"
              aria-label="Apply"
            >
              <Check className="h-6 w-6" strokeWidth={2.25} />
            </Button>
            <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-primary">Apply</span>
          </div>
        </div>
      </div>

      <MatchModal
        open={matchOpen}
        onOpenChange={setMatchOpen}
        name={matchName}
        chatHref={matchHref}
        imageUrl={matchImage}
        selfImageUrl={selfImageUrl}
        selfName={selfName}
      />
    </div>
  )
}
