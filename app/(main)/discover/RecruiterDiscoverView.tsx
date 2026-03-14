"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { SwipeCard } from "@/components/swipe/SwipeCard"
import { CandidateCard } from "@/components/swipe/CandidateCard"
import { useToast } from "@/lib/hooks/use-toast"
import { X, Heart, Loader2, Users, Zap } from "lucide-react"
import type { Profile, StudentProfile } from "@/types"

interface Candidate { profile: Profile; studentProfile: StudentProfile }

export function RecruiterDiscoverView({ userId }: { userId: string }) {
  const { toast } = useToast()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [swiping, setSwiping] = useState(false)
  const [jobs, setJobs] = useState<{ id: string; title: string; job_type: string }[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string>("")

  useEffect(() => { loadInitialData() }, [])

  const loadInitialData = async () => {
    const supabase = createClient()
    const { data: jobsData } = await supabase.from("jobs").select("id, title, job_type").eq("recruiter_id", userId).eq("is_active", true)
    setJobs(jobsData || [])
    if (jobsData?.[0]) { setSelectedJobId(jobsData[0].id); await loadCandidates(jobsData[0].id) }
    else setLoading(false)
  }

  const loadCandidates = async (jobId: string) => {
    setLoading(true)
    const supabase = createClient()
    const { data: swipedIds } = await supabase.from("candidate_swipes").select("student_id").eq("recruiter_id", userId).eq("job_id", jobId)
    const swiped = swipedIds?.map((s: any) => s.student_id) || []
    const { data } = await supabase.from("student_profiles").select("*, profiles!inner(*)").limit(20)
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
    await supabase.from("candidate_swipes").insert({ recruiter_id: userId, student_id: candidate.profile.id, job_id: selectedJobId, direction })
    if (direction === "right") toast({ title: "Liked!", description: `You liked ${candidate.profile.full_name}` })
    setCurrentIndex(prev => prev + 1)
    setTimeout(() => setSwiping(false), 100)
  }, [userId, selectedJobId, swiping, currentIndex, candidates, toast])

  const currentCandidate = candidates[currentIndex]
  const nextCandidate = candidates[currentIndex + 1]

  return (
    <div className="flex flex-col min-h-screen bg-[#030304]">
      {/* Header */}
      <div className="p-4 pt-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl text-white">Discover</h1>
            <p className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8] mt-0.5">Find your next hire</p>
          </div>
        </div>
        {jobs.length > 0 && (
          <select
            value={selectedJobId}
            onChange={(e) => { setSelectedJobId(e.target.value); loadCandidates(e.target.value) }}
            className="w-full h-10 px-3 rounded-xl bg-[#0F1115] border border-white/10 text-white text-sm focus:outline-none focus:border-[#F7931A]/50 transition-colors"
          >
            {jobs.map((j) => <option key={j.id} value={j.id} className="bg-[#0F1115]">{j.title}</option>)}
          </select>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center animate-pulse shadow-[0_0_20px_-3px_rgba(247,147,26,0.6)]">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <p className="font-data text-xs tracking-widest uppercase text-[#94A3B8]">Finding candidates...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center gap-4 text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-[#F7931A]/15 border border-[#F7931A]/30 flex items-center justify-center">
              <Users className="h-8 w-8 text-[#F7931A]" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg text-white">No active jobs</h3>
              <p className="font-body text-sm text-[#94A3B8] mt-1">Post a job first to start discovering candidates</p>
            </div>
          </div>
        ) : currentIndex >= candidates.length ? (
          <div className="flex flex-col items-center gap-5 text-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-[#F7931A]/15 border border-[#F7931A]/30 flex items-center justify-center">
              <Users className="h-10 w-10 text-[#F7931A]" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-xl text-white">All caught up!</h3>
              <p className="font-body text-sm text-[#94A3B8] mt-1 max-w-[250px]">No more candidates to review right now.</p>
            </div>
            <button onClick={() => loadCandidates(selectedJobId)}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#EA580C] to-[#F7931A] text-white font-body font-semibold text-sm shadow-[0_0_20px_-5px_rgba(234,88,12,0.5)] hover:shadow-[0_0_30px_-5px_rgba(247,147,26,0.7)] transition-all duration-300">
              Refresh
            </button>
          </div>
        ) : (
          <div className="relative w-full max-w-sm">
            {nextCandidate && (
              <div className="absolute inset-0 scale-[0.96] -translate-y-3 opacity-60 pointer-events-none rounded-3xl overflow-hidden">
                <CandidateCard profile={nextCandidate.profile} studentProfile={nextCandidate.studentProfile} />
              </div>
            )}
            <SwipeCard key={currentCandidate.profile.id} onSwipeLeft={() => handleSwipe("left")} onSwipeRight={() => handleSwipe("right")} disabled={swiping}>
              <CandidateCard profile={currentCandidate.profile} studentProfile={currentCandidate.studentProfile} />
            </SwipeCard>
          </div>
        )}
      </div>

      {currentIndex < candidates.length && !loading && (
        <div className="flex justify-center items-center gap-6 pb-6 px-4">
          <button onClick={() => handleSwipe("left")} disabled={swiping}
            className="h-14 w-14 rounded-full bg-[#0F1115] border-2 border-red-500/30 shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)] flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/60 hover:shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)] transition-all duration-200 active:scale-90">
            <X className="h-7 w-7 text-red-400" />
          </button>
          <button onClick={() => handleSwipe("right")} disabled={swiping}
            className="h-14 w-14 rounded-full bg-gradient-to-br from-[#EA580C] to-[#F7931A] shadow-[0_0_20px_-5px_rgba(247,147,26,0.6)] flex items-center justify-center hover:shadow-[0_0_30px_-5px_rgba(247,147,26,0.9)] transition-all duration-200 active:scale-90">
            <Heart className="h-7 w-7 text-white" fill="white" />
          </button>
        </div>
      )}
    </div>
  )
}
