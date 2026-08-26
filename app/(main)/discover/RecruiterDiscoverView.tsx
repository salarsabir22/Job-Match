"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { SwipeCard } from "@/components/swipe/SwipeCard"
import { CandidateCard } from "@/components/swipe/CandidateCard"
import { ConfettiBurst } from "@/components/motion/ConfettiBurst"
import { DiscoverLoading } from "@/components/discover"
import Link from "next/link"
import { X, Star } from "lucide-react"
import type { Profile, StudentProfile } from "@/types"

interface Candidate {
  profile: Profile
  studentProfile: StudentProfile
}

interface Job {
  id: string
  title: string
}

type SwipeRow = { student_id: string; direction: string }
type StudentProfileRow = StudentProfile & { profiles: Profile; id: string }

export function RecruiterDiscoverView({ userId }: { userId: string }) {
  const router = useRouter()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [swiping, setSwiping] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string>("")
  const [celebrate, setCelebrate] = useState(false)

  async function loadCandidates(jobId: string) {
    setLoading(true)
    const supabase = createClient()
    const { data: swipedIds } = await supabase
      .from("candidate_swipes")
      .select("student_id, direction")
      .eq("recruiter_id", userId)
      .eq("job_id", jobId)
    const swiped = (swipedIds || []).map((s: SwipeRow) => s.student_id)

    const { data } = await supabase.from("student_profiles").select("*, profiles!inner(*)").limit(30)
    const filtered = (data || []).filter((sp: StudentProfileRow) => !swiped.includes(sp.id))
    setCandidates(
      filtered.map((sp: StudentProfileRow) => ({
        profile: sp.profiles as Profile,
        studentProfile: sp as StudentProfile,
      }))
    )
    setCurrentIndex(0)
    setLoading(false)
  }

  async function loadInitialData() {
    const supabase = createClient()
    const { data: jobsData } = await supabase
      .from("jobs")
      .select("id, title")
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
      if (direction === "right") {
        setCelebrate(true)
        setTimeout(() => setCelebrate(false), 1200)
      }
      setCurrentIndex((prev) => prev + 1)
      setTimeout(() => setSwiping(false), 100)
    },
    [userId, selectedJobId, swiping, currentIndex, candidates]
  )

  const currentCandidate = candidates[currentIndex]
  const nextCandidate = candidates[currentIndex + 1]

  if (loading) {
    return <DiscoverLoading label="Pulling talent…" />
  }

  if (jobs.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-4xl" aria-hidden>
          📭
        </p>
        <h2 className="mt-4 font-heading text-xl font-semibold">Post a role first</h2>
        <p className="mt-2 max-w-sm font-body text-sm text-muted-foreground">
          Discover is tied to an open job so shortlists actually mean something.
        </p>
        <Link
          href="/jobs/new"
          className="mt-6 rounded-full bg-primary px-6 py-2.5 font-body text-sm font-semibold text-primary-foreground"
        >
          Post a job
        </Link>
      </div>
    )
  }

  if (currentIndex >= candidates.length) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <select
          className="h-10 max-w-xs rounded-full border border-border bg-card px-4 font-body text-sm"
          value={selectedJobId}
          onChange={(e) => {
            setSelectedJobId(e.target.value)
            void loadCandidates(e.target.value)
          }}
        >
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </select>
        <p className="text-4xl" aria-hidden>
          ✨
        </p>
        <h2 className="font-heading text-xl font-semibold">That&apos;s everyone for now</h2>
        <button
          type="button"
          className="rounded-full bg-primary px-6 py-2.5 font-body text-sm font-semibold text-primary-foreground"
          onClick={() => void loadCandidates(selectedJobId)}
        >
          Refresh
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 py-2">
      <ConfettiBurst show={celebrate} />
      <select
        className="h-10 max-w-xs rounded-full border border-border bg-card px-4 font-body text-sm"
        value={selectedJobId}
        onChange={(e) => {
          setSelectedJobId(e.target.value)
          void loadCandidates(e.target.value)
        }}
        aria-label="Shortlisting for"
      >
        {jobs.map((j) => (
          <option key={j.id} value={j.id}>
            Shortlisting for: {j.title}
          </option>
        ))}
      </select>

      <div className="relative mx-auto w-full max-w-[380px]">
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
          />
        </SwipeCard>
      </div>

      <button
        type="button"
        className="font-body text-xs font-medium text-primary underline-offset-4 hover:underline"
        onClick={() => router.push(`/candidates/${currentCandidate.profile.id}?job=${selectedJobId}`)}
      >
        Open full profile
      </button>

      <div className="flex items-center justify-center gap-8">
        <button
          type="button"
          onClick={() => handleSwipe("left")}
          disabled={swiping}
          className="flex flex-col items-center gap-1.5 disabled:opacity-50"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm active:scale-95">
            <X className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Pass</span>
        </button>
        <button
          type="button"
          onClick={() => handleSwipe("right")}
          disabled={swiping}
          className="flex flex-col items-center gap-1.5 disabled:opacity-50"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md active:scale-95">
            <Star className="h-6 w-6" fill="currentColor" strokeWidth={1.5} />
          </span>
          <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-primary">Shortlist</span>
        </button>
      </div>
    </div>
  )
}
