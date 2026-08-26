"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { SwipeCard } from "@/components/swipe/SwipeCard"
import { JobCard } from "@/components/swipe/JobCard"
import { ConfettiBurst } from "@/components/motion/ConfettiBurst"
import { DiscoverLoading } from "@/components/discover"
import { recordJobView, notifyApplicationMilestone } from "@/lib/engagement"
import { X, Heart } from "lucide-react"
import type { Job } from "@/types"

type JobSwipeRow = { job_id: string; direction: string }

export function StudentDiscoverView({ userId }: { userId: string }) {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [swiping, setSwiping] = useState(false)
  const [celebrate, setCelebrate] = useState(false)

  async function loadJobs() {
    setLoading(true)
    const supabase = createClient()
    const { data: swipeRows } = await supabase.from("job_swipes").select("job_id, direction").eq("student_id", userId)
    const swipedJobIds = ((swipeRows || []) as JobSwipeRow[]).map((s) => s.job_id)

    let query = supabase
      .from("jobs")
      .select("*, recruiter_profiles(id, company_name, logo_url, website_url, description, is_approved)")
      .eq("is_active", true)

    if (swipedJobIds.length > 0) {
      query = query.not("id", "in", `(${swipedJobIds.join(",")})`)
    }

    const { data } = await query.order("created_at", { ascending: false }).limit(20)
    const rows = (data || []) as Job[]
    setJobs(rows.filter((j) => j.recruiter_profiles?.is_approved === true))
    setCurrentIndex(0)
    setLoading(false)
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadJobs()
    })
  }, [])

  const currentJob = jobs[currentIndex]
  const nextJob = jobs[currentIndex + 1]

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
    async (direction: "right" | "left") => {
      if (swiping || currentIndex >= jobs.length) return
      const job = jobs[currentIndex]
      setSwiping(true)
      const supabase = createClient()
      await supabase.from("job_swipes").insert({ student_id: userId, job_id: job.id, direction })

      if (direction === "right") {
        setCelebrate(true)
        setTimeout(() => setCelebrate(false), 1200)
        void notifyApplicationMilestone(supabase, {
          jobId: job.id,
          recruiterId: job.recruiter_id,
          jobTitle: job.title,
        })
      }

      setCurrentIndex((prev) => prev + 1)
      setTimeout(() => setSwiping(false), 100)
    },
    [userId, swiping, currentIndex, jobs]
  )

  if (loading) {
    return <DiscoverLoading label="Finding roles that actually slap…" />
  }

  if (currentIndex >= jobs.length) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-4xl" aria-hidden>
          {jobs.length === 0 ? "😴" : "🫡"}
        </p>
        <h2 className="mt-4 font-heading text-xl font-semibold tracking-tight">
          {jobs.length === 0 ? "Feed's dry rn" : "That's the stack"}
        </h2>
        <p className="mt-2 max-w-sm font-body text-sm text-muted-foreground">
          {jobs.length === 0
            ? "No new roles from verified teams yet. Hit refresh in a bit."
            : "You cleared this batch. Pull a fresh stack whenever."}
        </p>
        <button
          type="button"
          className="mt-6 rounded-full bg-primary px-6 py-2.5 font-body text-sm font-semibold text-primary-foreground"
          onClick={() => void loadJobs()}
        >
          Refresh feed
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 py-2">
      <ConfettiBurst show={celebrate} />
      <div className="relative mx-auto w-full max-w-[380px]">
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
            onOpenCompany={() => router.push(`/company/${currentJob.recruiter_id}`)}
          />
        </SwipeCard>
      </div>

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
            <Heart className="h-6 w-6" fill="currentColor" strokeWidth={1.5} />
          </span>
          <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-primary">Apply</span>
        </button>
      </div>
    </div>
  )
}
