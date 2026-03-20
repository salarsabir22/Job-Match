"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { SwipeCard } from "@/components/swipe/SwipeCard"
import { CandidateCard } from "@/components/swipe/CandidateCard"
import { useToast } from "@/lib/hooks/use-toast"
import {
  X, Heart, Loader2, Users, Zap, GraduationCap, Calendar,
  Github, Linkedin, Link2, FileText, Briefcase, TrendingUp,
  ChevronDown, Star, CheckCircle,
} from "lucide-react"
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

export function RecruiterDiscoverView({ userId }: { userId: string }) {
  const { toast } = useToast()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [swiping, setSwiping] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string>("")
  const [stats, setStats] = useState<Stats>({ liked: 0, passed: 0, total: 0 })

  useEffect(() => { loadInitialData() }, [])

  const loadInitialData = async () => {
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

  const loadCandidates = async (jobId: string) => {
    setLoading(true)
    const supabase = createClient()
    const { data: swipedIds } = await supabase
      .from("candidate_swipes")
      .select("student_id, direction")
      .eq("recruiter_id", userId)
      .eq("job_id", jobId)
    const swiped = (swipedIds || []).map((s: any) => s.student_id)
    const liked  = (swipedIds || []).filter((s: any) => s.direction === "right").length
    const passed = (swipedIds || []).filter((s: any) => s.direction === "left").length
    setStats({ liked, passed, total: swiped.length })

    const { data } = await supabase
      .from("student_profiles")
      .select("*, profiles!inner(*)")
      .limit(30)
    const filtered = (data || []).filter((sp: any) => !swiped.includes(sp.id))
    setCandidates(filtered.map((sp: any) => ({ profile: sp.profiles as Profile, studentProfile: sp as StudentProfile })))
    setCurrentIndex(0)
    setLoading(false)
  }

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
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#525252] to-[#FAFAFA] flex items-center justify-center animate-pulse shadow-[0_0_20px_-3px_rgba(255,255,255,0.6)]">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <p className="font-data text-xs tracking-widest uppercase text-[#94A3B8]">Finding candidates...</p>
        </div>
      </div>
    )
  }

  /* ── No jobs posted ── */
  if (jobs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-white">Discover Candidates</h1>
          <p className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8] mt-0.5">Find your next hire</p>
        </div>
        <div className="flex flex-col items-center gap-4 text-center py-24 rounded-2xl bg-[#0F1115] border border-white/8">
          <div className="w-16 h-16 rounded-2xl bg-[#FAFAFA]/15 border border-[#FAFAFA]/30 flex items-center justify-center">
            <Briefcase className="h-8 w-8 text-[#FAFAFA]" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-lg text-white">No active jobs</h3>
            <p className="font-body text-sm text-[#94A3B8] mt-1">Post a job first to start discovering candidates</p>
          </div>
          <a href="/jobs" className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#525252] to-[#FAFAFA] text-white font-body font-semibold text-sm">
            Post a Job
          </a>
        </div>
      </div>
    )
  }

  const selectedJob = jobs.find(j => j.id === selectedJobId)

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading font-bold text-2xl text-white">Discover Candidates</h1>
          <p className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8] mt-0.5">
            {remaining > 0 ? `${remaining} candidates to review` : "All reviewed"}
            {selectedJob ? ` · ${selectedJob.title}` : ""}
          </p>
        </div>

        {/* Job selector */}
        <div className="relative">
          <select
            value={selectedJobId}
            onChange={(e) => { setSelectedJobId(e.target.value); loadCandidates(e.target.value) }}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-[#0F1115] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FAFAFA]/50 transition-colors font-body min-w-[200px]"
          >
            {jobs.map((j) => <option key={j.id} value={j.id} className="bg-[#0F1115]">{j.title}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8] pointer-events-none" />
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Liked",  value: stats.liked,  color: "#FAFAFA", bg: "#FAFAFA" },
          { label: "Passed", value: stats.passed, color: "#94A3B8", bg: "#94A3B8" },
          { label: "Reviewed", value: stats.total, color: "#D4D4D4", bg: "#D4D4D4" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-xl bg-[#0F1115] border border-white/8 p-3 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${bg}15` }}>
              <span className="font-heading font-bold text-sm" style={{ color }}>{value}</span>
            </div>
            <p className="font-data text-[9px] tracking-wider uppercase text-[#94A3B8]">{label}</p>
          </div>
        ))}
      </div>

      {/* All reviewed */}
      {currentIndex >= candidates.length ? (
        <div className="flex flex-col items-center gap-5 text-center py-20 rounded-2xl bg-[#0F1115] border border-white/8">
          <div className="w-20 h-20 rounded-3xl bg-[#FAFAFA]/15 border border-[#FAFAFA]/30 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-[#FAFAFA]" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-xl text-white">All caught up!</h3>
            <p className="font-body text-sm text-[#94A3B8] mt-1">
              You&apos;ve reviewed all {stats.total} candidate{stats.total !== 1 ? "s" : ""} for this job.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-left w-full max-w-xs">
            <div className="rounded-xl bg-[#0A0B0E] border border-white/6 p-3 text-center">
              <p className="font-heading font-bold text-xl text-[#FAFAFA]">{stats.liked}</p>
              <p className="font-data text-[9px] tracking-wider uppercase text-[#94A3B8] mt-0.5">Liked</p>
            </div>
            <div className="rounded-xl bg-[#0A0B0E] border border-white/6 p-3 text-center">
              <p className="font-heading font-bold text-xl text-[#94A3B8]">{stats.passed}</p>
              <p className="font-data text-[9px] tracking-wider uppercase text-[#94A3B8] mt-0.5">Passed</p>
            </div>
          </div>
          <button
            onClick={() => loadCandidates(selectedJobId)}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#525252] to-[#FAFAFA] text-white font-body font-semibold text-sm"
          >
            Refresh Candidates
          </button>
        </div>
      ) : (
        /* ── Two-column desktop layout ── */
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">

          {/* Left: swipe card + controls */}
          <div className="flex flex-col items-center gap-5 lg:sticky lg:top-6">
            <div className="relative w-full max-w-sm mx-auto">
              {nextCandidate && (
                <div className="absolute inset-0 scale-[0.96] -translate-y-3 opacity-60 pointer-events-none rounded-3xl overflow-hidden">
                  <CandidateCard profile={nextCandidate.profile} studentProfile={nextCandidate.studentProfile} />
                </div>
              )}
              <SwipeCard
                key={currentCandidate.profile.id}
                onSwipeLeft={() => handleSwipe("left")}
                onSwipeRight={() => handleSwipe("right")}
                disabled={swiping}
              >
                <CandidateCard profile={currentCandidate.profile} studentProfile={currentCandidate.studentProfile} />
              </SwipeCard>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center items-center gap-6">
              <button
                onClick={() => handleSwipe("left")}
                disabled={swiping}
                className="h-14 w-14 rounded-full bg-[#0F1115] border-2 border-neutral-500/30 shadow-[0_0_15px_-5px_rgba(255,255,255,0.3)] flex items-center justify-center hover:bg-red-500/10 hover:border-neutral-500/60 transition-all duration-200 active:scale-90"
              >
                <X className="h-7 w-7 text-neutral-500" />
              </button>
              <button
                onClick={() => handleSwipe("right")}
                disabled={swiping}
                className="h-14 w-14 rounded-full bg-gradient-to-br from-[#525252] to-[#FAFAFA] shadow-[0_0_20px_-5px_rgba(255,255,255,0.6)] flex items-center justify-center hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.9)] transition-all duration-200 active:scale-90"
              >
                <Heart className="h-7 w-7 text-white" fill="white" />
              </button>
            </div>

            <div className="flex items-center gap-5 font-data text-[9px] tracking-wider uppercase">
              <span className="text-neutral-500">← Pass</span>
              <span className="text-[#FAFAFA]">Like →</span>
            </div>
          </div>

          {/* Right: candidate detail panel */}
          <div className="space-y-4">
            {/* Candidate detail */}
            <div className="rounded-2xl bg-[#0F1115] border border-white/8 overflow-hidden">
              {/* Header gradient */}
              <div className="h-32 bg-gradient-to-br from-[#0a0f1a] via-[#0d1626] to-[#06080f] relative overflow-hidden flex items-end px-6 pb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-[#A3A3A3]/25 via-[#737373]/10 to-transparent pointer-events-none" />
                <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-[#A3A3A3]/8 blur-2xl" />
                <div className="flex items-end gap-4 relative z-10">
                  <Avatar className="h-16 w-16 border-[3px] border-[#A3A3A3]/40 shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)]">
                    <AvatarImage src={currentCandidate.profile.avatar_url || undefined} />
                    <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-[#A3A3A3] to-[#737373] text-white">
                      {getInitials(currentCandidate.profile.full_name || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-heading font-bold text-xl text-white">{currentCandidate.profile.full_name}</h2>
                    {currentCandidate.studentProfile.university && (
                      <p className="font-body text-sm text-[#94A3B8] flex items-center gap-1.5 mt-0.5">
                        <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                        {currentCandidate.studentProfile.university}
                        {currentCandidate.studentProfile.degree && ` · ${currentCandidate.studentProfile.degree}`}
                      </p>
                    )}
                    {currentCandidate.studentProfile.graduation_year && (
                      <p className="font-data text-[10px] text-[#94A3B8] flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        Class of {currentCandidate.studentProfile.graduation_year}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {(currentCandidate.profile as any).profile_video_url && (
                  <div className="rounded-xl overflow-hidden bg-black aspect-video max-h-[240px]">
                    <video
                      src={(currentCandidate.profile as any).profile_video_url}
                      controls
                      className="w-full h-full object-contain"
                      playsInline
                    />
                  </div>
                )}
                {currentCandidate.profile.bio && (
                  <div>
                    <p className="font-data text-[10px] tracking-widest uppercase text-[#94A3B8] mb-2">About</p>
                    <p className="font-body text-sm text-[#CBD5E1] leading-relaxed">{currentCandidate.profile.bio}</p>
                  </div>
                )}

                {currentCandidate.studentProfile.skills?.length > 0 && (
                  <div>
                    <p className="font-data text-[10px] tracking-widest uppercase text-[#94A3B8] mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {currentCandidate.studentProfile.skills.map((s: string) => (
                        <span key={s} className="font-data text-[10px] tracking-wide px-2.5 py-1 rounded-md bg-[#A3A3A3]/10 border border-[#A3A3A3]/20 text-[#A3A3A3]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {currentCandidate.studentProfile.preferred_job_categories?.length > 0 && (
                  <div>
                    <p className="font-data text-[10px] tracking-widest uppercase text-[#94A3B8] mb-2">Looking For</p>
                    <div className="flex flex-wrap gap-2">
                      {currentCandidate.studentProfile.preferred_job_categories.map((c: string) => (
                        <span key={c} className="font-data text-[10px] tracking-wide px-2.5 py-1 rounded-md bg-[#FAFAFA]/10 border border-[#FAFAFA]/20 text-[#FAFAFA]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Links */}
                <div className="flex items-center gap-3">
                  {currentCandidate.studentProfile.linkedin_url && (
                    <a href={currentCandidate.studentProfile.linkedin_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#A3A3A3]/8 border border-[#A3A3A3]/20 text-[#A3A3A3] hover:bg-[#A3A3A3]/15 transition-colors font-body text-xs">
                      <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                    </a>
                  )}
                  {currentCandidate.studentProfile.github_url && (
                    <a href={currentCandidate.studentProfile.github_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors font-body text-xs">
                      <Github className="h-3.5 w-3.5" /> GitHub
                    </a>
                  )}
                  {currentCandidate.studentProfile.portfolio_url && (
                    <a href={currentCandidate.studentProfile.portfolio_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors font-body text-xs">
                      <Link2 className="h-3.5 w-3.5" /> Portfolio
                    </a>
                  )}
                  {currentCandidate.studentProfile.resume_url && (
                    <a href={currentCandidate.studentProfile.resume_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FAFAFA]/8 border border-[#FAFAFA]/20 text-[#FAFAFA] hover:bg-[#FAFAFA]/15 transition-colors font-body text-xs">
                      <FileText className="h-3.5 w-3.5" /> Resume
                    </a>
                  )}
                </div>

                {/* Action buttons in detail panel (desktop) */}
                <div className="flex gap-3 pt-2 border-t border-white/6">
                  <button
                    onClick={() => handleSwipe("left")}
                    disabled={swiping}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/8 border border-neutral-500/20 text-neutral-500 hover:bg-red-500/15 transition-all font-body text-sm font-medium"
                  >
                    <X className="h-4 w-4" /> Pass
                  </button>
                  <button
                    onClick={() => handleSwipe("right")}
                    disabled={swiping}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#525252] to-[#FAFAFA] text-white hover:opacity-90 transition-all font-body text-sm font-semibold shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)]"
                  >
                    <Heart className="h-4 w-4" fill="currentColor" /> Like Candidate
                  </button>
                </div>
              </div>
            </div>

            {/* Queue: up next */}
            {candidates.slice(currentIndex + 1, currentIndex + 4).length > 0 && (
              <div className="rounded-2xl bg-[#0F1115] border border-white/8 p-4 space-y-3">
                <p className="font-data text-[10px] tracking-widest uppercase text-[#94A3B8]">Up Next</p>
                <div className="space-y-2">
                  {candidates.slice(currentIndex + 1, currentIndex + 4).map(({ profile, studentProfile }, i) => (
                    <div key={profile.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0A0B0E] border border-white/5 opacity-70">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-[#A3A3A3] to-[#737373] text-white">
                          {getInitials(profile.full_name || "?")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium text-white truncate">{profile.full_name}</p>
                        <p className="font-data text-[10px] text-[#94A3B8] truncate">{studentProfile.university ?? "Student"}</p>
                      </div>
                      <span className="font-data text-[9px] text-[#94A3B8] shrink-0">#{i + 2}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tip */}
            <div className="rounded-2xl bg-[#0F1115] border border-white/8 p-4 space-y-2">
              <p className="font-data text-[10px] tracking-widest uppercase text-[#94A3B8]">How it works</p>
              {[
                { color: "#FAFAFA", text: "Like a candidate to express interest in their profile" },
                { color: "#D4D4D4", text: "A mutual match happens when they also apply to your job" },
                { color: "#A3A3A3", text: "Matches unlock a private chat to coordinate interviews" },
              ].map(({ color, text }, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                  <p className="font-body text-xs text-[#94A3B8]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
