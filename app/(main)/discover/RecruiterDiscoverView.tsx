"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { SwipeCard } from "@/components/swipe/SwipeCard"
import { CandidateCard } from "@/components/swipe/CandidateCard"
import { ConfettiBurst } from "@/components/motion/ConfettiBurst"
import {
  DiscoverHeader,
  DiscoverHowItWorks,
  DiscoverLoading,
} from "@/components/discover"
import { DiscoverFilterSheet } from "@/components/discover/DiscoverFilterSheet"
import { MatchModal } from "@/components/match/MatchModal"
import { whyThisCandidate } from "@/lib/match/fit"
import { X, Star, RotateCcw, RefreshCw } from "lucide-react"
import type { Profile, StudentProfile } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { undoCandidateSwipe } from "@/lib/swipe/undo"
import { getBlockedPeerIds } from "@/lib/moderation/blocks"
import { useToast } from "@/lib/hooks/use-toast"

interface Candidate {
  profile: Profile
  studentProfile: StudentProfile
}

interface Job {
  id: string
  title: string
  required_skills?: string[] | null
}

type SwipeRow = { student_id: string; direction: string }
type StudentProfileRow = StudentProfile & { profiles: Profile; id: string }
type LastSwipe = { candidate: Candidate; direction: "right" | "left"; jobId: string }

export function RecruiterDiscoverView({
  userId,
  selfImageUrl,
  selfName = "You",
}: {
  userId: string
  selfImageUrl?: string | null
  selfName?: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [swiping, setSwiping] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string>("")
  const [celebrate, setCelebrate] = useState(false)
  const [lastSwipe, setLastSwipe] = useState<LastSwipe | null>(null)
  const [loadedAt, setLoadedAt] = useState<Date | null>(null)
  const [sessionShortlisted, setSessionShortlisted] = useState(0)
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([])
  const [university, setUniversity] = useState("")
  const [gradYear, setGradYear] = useState("")
  const [skillQuery, setSkillQuery] = useState("")
  const [matchOpen, setMatchOpen] = useState(false)
  const [matchName, setMatchName] = useState("")
  const [matchHref, setMatchHref] = useState<string | null>(null)
  const [matchImage, setMatchImage] = useState<string | null>(null)

  async function loadCandidates(jobId: string, jobList?: Job[]) {
    setLoading(true)
    const supabase = createClient()
    const [{ data: swipedIds }, blocked] = await Promise.all([
      supabase
        .from("candidate_swipes")
        .select("student_id, direction")
        .eq("recruiter_id", userId)
        .eq("job_id", jobId),
      getBlockedPeerIds(supabase, userId),
    ])
    const swiped = (swipedIds || []).map((s: SwipeRow) => s.student_id)

    const { data } = await supabase.from("student_profiles").select("*, profiles!inner(*)").limit(40)
    const filtered = (data || []).filter((sp: StudentProfileRow) => !swiped.includes(sp.id) && !blocked.has(sp.id))
    const mapped = filtered.map((sp: StudentProfileRow) => ({
      profile: sp.profiles as Profile,
      studentProfile: sp as StudentProfile,
    }))
    const jobSkills = (jobList || jobs).find((j) => j.id === jobId)?.required_skills
    mapped.sort((a, b) => {
      const score = (c: Candidate) =>
        whyThisCandidate({
          jobSkills,
          candidateSkills: c.studentProfile.skills,
          university: c.studentProfile.university,
        }).length
      return score(b) - score(a)
    })
    setAllCandidates(mapped)
    setCurrentIndex(0)
    setLastSwipe(null)
    setSessionShortlisted(0)
    setLoadedAt(new Date())
    setLoading(false)
  }

  async function loadInitialData() {
    const supabase = createClient()
    const { data: jobsData } = await supabase
      .from("jobs")
      .select("id, title, required_skills")
      .eq("recruiter_id", userId)
      .eq("is_active", true)
    const list = (jobsData as Job[]) || []
    setJobs(list)
    if (list[0]) {
      setSelectedJobId(list[0].id)
      await loadCandidates(list[0].id, list)
    } else {
      setLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadInitialData()
    })
  }, [])

  const candidates = useMemo(() => {
    const uni = university.trim().toLowerCase()
    const year = gradYear.trim()
    const skill = skillQuery.trim().toLowerCase()
    return allCandidates.filter((c) => {
      if (uni && !(c.studentProfile.university || "").toLowerCase().includes(uni)) return false
      if (year && String(c.studentProfile.graduation_year || "") !== year) return false
      if (skill && !(c.studentProfile.skills || []).some((s) => s.toLowerCase().includes(skill))) return false
      return true
    })
  }, [allCandidates, university, gradYear, skillQuery])

  useEffect(() => {
    setCurrentIndex(0)
  }, [university, gradYear, skillQuery])

  const handleSwipe = useCallback(
    async (direction: "right" | "left") => {
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
      setLastSwipe({ candidate, direction, jobId: selectedJobId })
      if (direction === "right") {
        setSessionShortlisted((n) => n + 1)
        const { data: match } = await supabase
          .from("matches")
          .select("id, conversations(id)")
          .eq("recruiter_id", userId)
          .eq("student_id", candidate.profile.id)
          .eq("job_id", selectedJobId)
          .maybeSingle()
        if (match?.id) {
          const conv = Array.isArray(match.conversations) ? match.conversations[0] : match.conversations
          setMatchName(candidate.profile.full_name || "this candidate")
          setMatchHref(conv?.id ? `/chat/${conv.id}` : `/chat/${match.id}`)
          setMatchImage(candidate.profile.avatar_url ?? null)
          setMatchOpen(true)
          setCelebrate(true)
          setTimeout(() => setCelebrate(false), 1200)
        }
      }
      setCurrentIndex((prev) => prev + 1)
      setTimeout(() => setSwiping(false), 100)
    },
    [userId, selectedJobId, swiping, currentIndex, candidates]
  )

  const handleUndo = useCallback(async () => {
    if (swiping || !lastSwipe) return
    setSwiping(true)
    const supabase = createClient()
    const result = await undoCandidateSwipe(supabase, {
      recruiterId: userId,
      studentId: lastSwipe.candidate.profile.id,
      jobId: lastSwipe.jobId,
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
    if (lastSwipe.direction === "right") setSessionShortlisted((n) => Math.max(0, n - 1))
    setLastSwipe(null)
    setCurrentIndex((prev) => Math.max(0, prev - 1))
    setTimeout(() => setSwiping(false), 100)
  }, [swiping, lastSwipe, userId, toast])

  const currentCandidate = candidates[currentIndex]
  const nextCandidate = candidates[currentIndex + 1]
  const remaining = Math.max(candidates.length - currentIndex, 0)
  const selectedJob = jobs.find((j) => j.id === selectedJobId)
  const selectedTitle = selectedJob?.title
  const currentReasons = currentCandidate
    ? whyThisCandidate({
        jobSkills: selectedJob?.required_skills,
        candidateSkills: currentCandidate.studentProfile.skills,
        university: currentCandidate.studentProfile.university,
      })
    : []

  const jobSelect = (
    <Select
      value={selectedJobId}
      onValueChange={(value) => {
        setSelectedJobId(value)
        void loadCandidates(value)
      }}
    >
      <SelectTrigger className="w-full rounded-full sm:w-[260px]" aria-label="Shortlisting for">
        <SelectValue placeholder="Select a role" />
      </SelectTrigger>
      <SelectContent>
        {jobs.map((j) => (
          <SelectItem key={j.id} value={j.id}>
            {j.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  if (loading) {
    return <DiscoverLoading label="Finding candidates…" />
  }

  if (jobs.length === 0) {
    return (
      <div className="space-y-8">
        <DiscoverHeader
          eyebrow="Discover"
          title="Shortlist candidates"
          description="Discover is tied to an open job so a shortlist actually maps to a role."
        />
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/40 px-4 py-16 text-center">
          <p className="font-heading text-xl font-semibold">Post a role first</p>
          <p className="mt-2 max-w-sm font-body text-sm text-muted-foreground">
            Once a listing is live, candidates show up here for that job.
          </p>
          <Button asChild className="mt-6">
            <Link href="/jobs/new">Post a job</Link>
          </Button>
        </div>
        <DiscoverHowItWorks audience="recruiter" />
      </div>
    )
  }

  const filterCount = (university.trim() ? 1 : 0) + (gradYear.trim() ? 1 : 0) + (skillQuery.trim() ? 1 : 0)

  const filters = (
    <DiscoverFilterSheet count={filterCount}>
      <Input
        className="h-10 rounded-xl"
        placeholder="University"
        value={university}
        onChange={(e) => setUniversity(e.target.value)}
        aria-label="Filter by university"
      />
      <Input
        className="h-10 rounded-xl"
        placeholder="Grad year"
        inputMode="numeric"
        value={gradYear}
        onChange={(e) => setGradYear(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
        aria-label="Filter by graduation year"
      />
      <Input
        className="h-10 rounded-xl"
        placeholder="Skill"
        value={skillQuery}
        onChange={(e) => setSkillQuery(e.target.value)}
        aria-label="Filter by skill"
      />
    </DiscoverFilterSheet>
  )

  const swipeChrome = (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-xl font-semibold tracking-tight">Shortlist</h1>
          <p className="mt-0.5 font-body text-sm text-muted-foreground">
            {remaining} left{sessionShortlisted ? ` · ${sessionShortlisted} shortlisted` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {filters}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => void loadCandidates(selectedJobId)}
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {jobSelect}
    </div>
  )

  const emptyChrome = (
    <DiscoverHeader
      eyebrow="Discover"
      title="Shortlist candidates"
      description={
        selectedTitle
          ? `Review people for ${selectedTitle}. Shortlist opens chat; pass hides them from this role.`
          : "Pick a live role, then swipe."
      }
      action={
        <div className="flex flex-wrap items-center gap-2">
          {filters}
          {jobSelect}
        </div>
      }
    />
  )

  if (currentIndex >= candidates.length) {
    return (
      <div className="space-y-8">
        {emptyChrome}
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/40 px-4 py-16 text-center">
          <p className="font-heading text-xl font-semibold">
            {allCandidates.length === 0
              ? "That’s everyone for this role"
              : candidates.length === 0
                ? "Nothing matches these filters"
                : "That’s everyone for this role"}
          </p>
          <p className="mt-2 max-w-sm font-body text-sm text-muted-foreground">
            {candidates.length === 0 && allCandidates.length > 0
              ? "Clear university, year, or skill filters to see more of this stack."
              : "Switch jobs from the menu, refresh, or undo the last swipe."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Button type="button" onClick={() => void loadCandidates(selectedJobId)}>
              Refresh
            </Button>
            {lastSwipe && lastSwipe.jobId === selectedJobId ? (
              <Button type="button" variant="outline" onClick={() => void handleUndo()} disabled={swiping}>
                <RotateCcw className="h-4 w-4" />
                Undo last swipe
              </Button>
            ) : null}
          </div>
        </div>
        <DiscoverHowItWorks audience="recruiter" />
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
      <MatchModal
        open={matchOpen}
        onOpenChange={setMatchOpen}
        name={matchName}
        chatHref={matchHref}
        imageUrl={matchImage}
        selfImageUrl={selfImageUrl}
        selfName={selfName}
      />

      <div className="flex flex-col items-center gap-5">
        <div className="relative mx-auto w-full max-w-[26rem] lg:max-w-[28rem]">
          {nextCandidate ? (
            <div className="pointer-events-none absolute inset-0 -translate-y-3 scale-[0.96] overflow-hidden rounded-3xl opacity-50">
              <CandidateCard profile={nextCandidate.profile} studentProfile={nextCandidate.studentProfile} />
            </div>
          ) : null}
          <SwipeCard
            key={currentCandidate.profile.id}
            onSwipeLeft={() => handleSwipe("left")}
            onSwipeRight={() => handleSwipe("right")}
            disabled={swiping}
            rightStampLabel="Shortlist"
            leftStampLabel="Pass"
          >
            <CandidateCard
              profile={currentCandidate.profile}
              studentProfile={currentCandidate.studentProfile}
              reasons={currentReasons}
            />
          </SwipeCard>
        </div>

        <Button
          type="button"
          variant="link"
          onClick={() => router.push(`/candidates/${currentCandidate.profile.id}?job=${selectedJobId}`)}
        >
          Open full profile
        </Button>

        <div className="flex items-end justify-center gap-4 sm:gap-6">
          <div className="flex flex-col items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void handleUndo()}
              disabled={swiping || !lastSwipe || lastSwipe.jobId !== selectedJobId}
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
              size="icon"
              onClick={() => handleSwipe("right")}
              disabled={swiping}
              className="h-14 w-14 rounded-full"
              aria-label="Shortlist"
            >
              <Star className="h-6 w-6" fill="currentColor" strokeWidth={1.5} />
            </Button>
            <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-primary">Shortlist</span>
          </div>
        </div>
      </div>
    </div>
  )
}
