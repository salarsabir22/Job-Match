"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { SwipeCard } from "@/components/swipe/SwipeCard"
import { CandidateCard } from "@/components/swipe/CandidateCard"
import { useToast } from "@/lib/hooks/use-toast"
import Link from "next/link"
import { X, Heart, ChevronDown, CheckCircle, UserSearch } from "lucide-react"
import { PageSymbol } from "@/components/ui/page-symbol"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-9 w-9 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin"
            aria-hidden
          />
          <p className="font-body text-sm text-neutral-600">Loading candidates…</p>
        </div>
      </div>
    )
  }

  /* ── No jobs posted ── */
  if (jobs.length === 0) {
    return (
      <div className="space-y-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <PageSymbol icon={UserSearch} className="sm:mt-0.5" />
          <div className="space-y-1 min-w-0">
            <h1 className="font-heading font-bold text-3xl tracking-tight text-neutral-950">Discover</h1>
            <p className="font-body text-sm text-neutral-600">Review applicants for your open roles.</p>
          </div>
        </header>
        <div className="flex flex-col items-center gap-5 text-center py-20 px-6 rounded-2xl border border-neutral-200 bg-neutral-50/50">
          <div>
            <h3 className="font-heading text-lg font-semibold text-neutral-950">No active listings</h3>
            <p className="font-body text-sm text-neutral-600 mt-2 max-w-sm mx-auto">
              Publish a role to start browsing candidates matched to that position.
            </p>
          </div>
          <Link
            href="/jobs"
            className="rounded-full bg-neutral-950 px-6 py-2.5 font-body text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Post a job
          </Link>
        </div>
      </div>
    )
  }

  const selectedJob = jobs.find(j => j.id === selectedJobId)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <header className="space-y-1 min-w-0">
          <h1 className="font-heading font-bold text-3xl tracking-tight text-neutral-950">Discover</h1>
          <p className="font-body text-sm text-neutral-600">
            {remaining > 0
              ? `${remaining} candidate${remaining === 1 ? "" : "s"} left for this role.`
              : "You're through this list for now."}
            {selectedJob && (
              <span className="block sm:inline sm:before:content-['\00a0·\00a0'] mt-0.5 sm:mt-0 font-medium text-neutral-800 truncate">
                {selectedJob.title}
              </span>
            )}
          </p>
          </div>
        </header>

        <div className="relative shrink-0">
          <select
            value={selectedJobId}
            onChange={(e) => {
              setSelectedJobId(e.target.value)
              void loadCandidates(e.target.value)
            }}
            aria-label="Select job listing"
            className="appearance-none w-full sm:w-auto min-w-[12rem] rounded-xl border border-neutral-200 bg-white py-2.5 pl-4 pr-10 font-body text-sm text-neutral-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-950/10"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" aria-hidden />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px rounded-2xl bg-neutral-200/80 overflow-hidden border border-neutral-200/80">
        {[
          { label: "Liked", value: stats.liked },
          { label: "Passed", value: stats.passed },
          { label: "Reviewed", value: stats.total },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white px-4 py-4 text-center sm:text-left">
            <p className="font-heading text-2xl font-semibold tabular-nums text-neutral-950">{value}</p>
            <p className="font-body text-xs text-neutral-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* All reviewed */}
      {currentIndex >= candidates.length ? (
        <div className="flex flex-col items-center gap-6 text-center py-14 px-6 rounded-2xl border border-neutral-200 bg-white">
          <CheckCircle className="h-10 w-10 text-neutral-300" strokeWidth={1.25} aria-hidden />
          <div>
            <h3 className="font-heading text-xl font-semibold text-neutral-950">List complete</h3>
            <p className="font-body text-sm text-neutral-600 mt-2 max-w-sm mx-auto">
              You&apos;ve reviewed {stats.total} candidate{stats.total !== 1 ? "s" : ""} for this role. Refresh to
              reload the pool.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-4 w-full max-w-xs text-left">
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4">
              <dt className="font-body text-xs text-neutral-500">Liked</dt>
              <dd className="font-heading text-xl font-semibold tabular-nums text-neutral-950 mt-1">{stats.liked}</dd>
            </div>
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4">
              <dt className="font-body text-xs text-neutral-500">Passed</dt>
              <dd className="font-heading text-xl font-semibold tabular-nums text-neutral-950 mt-1">{stats.passed}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => void loadCandidates(selectedJobId)}
            className="rounded-full bg-neutral-950 px-6 py-2.5 font-body text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Refresh list
          </button>
        </div>
      ) : (
        /* ── Two-column desktop layout ── */
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 lg:gap-10 items-start">
          <div className="flex flex-col items-center gap-5 lg:sticky lg:top-6">
            <div className="relative w-full max-w-sm mx-auto">
              {nextCandidate && (
                <div className="absolute inset-0 scale-[0.96] -translate-y-3 opacity-50 pointer-events-none rounded-3xl overflow-hidden">
                  <CandidateCard profile={nextCandidate.profile} studentProfile={nextCandidate.studentProfile} />
                </div>
              )}
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

            <div className="flex justify-center items-center gap-4">
              <button
                type="button"
                onClick={() => handleSwipe("left")}
                disabled={swiping}
                aria-label="Pass on this candidate"
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border border-neutral-200 bg-white text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.97] disabled:opacity-50"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6 mx-auto" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => handleSwipe("right")}
                disabled={swiping}
                aria-label="Like this candidate"
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-neutral-950 text-white shadow-sm transition hover:bg-neutral-800 active:scale-[0.97] disabled:opacity-50"
              >
                <Heart className="h-5 w-5 sm:h-6 sm:w-6 mx-auto" fill="currentColor" stroke="currentColor" strokeWidth={1.5} />
              </button>
            </div>

            <p className="font-body text-xs text-neutral-500 text-center">Swipe or tap pass / like</p>
          </div>

          <div className="space-y-6">
            <article className="rounded-2xl bg-white border border-neutral-200 overflow-hidden shadow-sm">
              <div className="h-28 bg-neutral-950 flex items-end px-6 pb-5">
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

              <div className="p-6 sm:p-8 space-y-6">
                {currentCandidate.profile.profile_video_url && (
                  <div className="rounded-xl overflow-hidden bg-neutral-100 aspect-video max-h-[240px] ring-1 ring-neutral-200">
                    <video
                      src={currentCandidate.profile.profile_video_url}
                      controls
                      className="w-full h-full object-contain"
                      playsInline
                    />
                  </div>
                )}
                {currentCandidate.profile.bio && (
                  <div>
                    <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
                      About
                    </h3>
                    <p className="font-body text-sm text-neutral-700 leading-relaxed">{currentCandidate.profile.bio}</p>
                  </div>
                )}

                {currentCandidate.studentProfile.skills?.length > 0 && (
                  <div>
                    <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentCandidate.studentProfile.skills.map((s: string) => (
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

                {currentCandidate.studentProfile.preferred_job_categories?.length > 0 && (
                  <div>
                    <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
                      Interested in
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentCandidate.studentProfile.preferred_job_categories.map((c: string) => (
                        <span
                          key={c}
                          className="rounded-md border border-neutral-100 bg-white px-2.5 py-1 font-body text-xs text-neutral-600"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-neutral-100 pt-4">
                  {currentCandidate.studentProfile.linkedin_url && (
                    <a
                      href={currentCandidate.studentProfile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-sm font-medium text-neutral-950 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950"
                    >
                      LinkedIn
                    </a>
                  )}
                  {currentCandidate.studentProfile.github_url && (
                    <a
                      href={currentCandidate.studentProfile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-sm font-medium text-neutral-950 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950"
                    >
                      GitHub
                    </a>
                  )}
                  {currentCandidate.studentProfile.portfolio_url && (
                    <a
                      href={currentCandidate.studentProfile.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-sm font-medium text-neutral-950 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950"
                    >
                      Portfolio
                    </a>
                  )}
                  {currentCandidate.studentProfile.resume_url && (
                    <a
                      href={currentCandidate.studentProfile.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-sm font-medium text-neutral-950 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950"
                    >
                      Resume
                    </a>
                  )}
                </div>

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
                    onClick={() => handleSwipe("right")}
                    disabled={swiping}
                    className="flex-1 rounded-xl bg-neutral-950 py-3 font-body text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
                  >
                    Like
                  </button>
                </div>
              </div>
            </article>

            {candidates.slice(currentIndex + 1, currentIndex + 4).length > 0 && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">
                  Up next
                </h3>
                <ul className="space-y-1">
                  {candidates.slice(currentIndex + 1, currentIndex + 4).map(({ profile, studentProfile }, i) => (
                    <li key={profile.id} className="flex items-center gap-3 rounded-xl py-2.5 px-1 -mx-1">
                      <Avatar className="h-9 w-9 shrink-0 ring-1 ring-neutral-200">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-neutral-100 text-neutral-700">
                          {getInitials(profile.full_name || "?")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium text-neutral-950 truncate">{profile.full_name}</p>
                        <p className="font-body text-xs text-neutral-500 truncate">
                          {studentProfile.university ?? "Student"}
                        </p>
                      </div>
                      <span className="font-body text-xs tabular-nums text-neutral-400 shrink-0">{i + 2}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5">
              <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">
                How it works
              </h3>
              <ol className="list-decimal list-inside space-y-2 font-body text-sm text-neutral-600">
                <li>Liking signals interest in a candidate&apos;s profile.</li>
                <li>If they applied to your role and you both align, it&apos;s a match.</li>
                <li>Matches open a private thread to schedule interviews.</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
