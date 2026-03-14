"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { SwipeCard } from "@/components/swipe/SwipeCard"
import { JobCard } from "@/components/swipe/JobCard"
import { useToast } from "@/lib/hooks/use-toast"
import { X, Heart, Bookmark, Loader2, Sparkles, Zap } from "lucide-react"
import type { Job } from "@/types"

export function StudentDiscoverView({ userId }: { userId: string }) {
  const { toast } = useToast()
  const [jobs, setJobs] = useState<Job[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [swiping, setSwiping] = useState(false)

  useEffect(() => { loadJobs() }, [])

  const loadJobs = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: swipedJobIds } = await supabase.from("job_swipes").select("job_id").eq("student_id", userId)
    const swiped = (swipedJobIds || []).map((s: any) => s.job_id)
    let query = supabase.from("jobs").select("*, recruiter_profiles(id, company_name, logo_url, website_url, description)").eq("is_active", true)
    if (swiped.length > 0) query = query.not("id", "in", `(${swiped.join(",")})`)
    const { data } = await query.order("created_at", { ascending: false }).limit(20)
    setJobs(data || [])
    setCurrentIndex(0)
    setLoading(false)
  }

  const handleSwipe = useCallback(async (direction: "right" | "left" | "saved") => {
    if (swiping || currentIndex >= jobs.length) return
    const job = jobs[currentIndex]
    setSwiping(true)
    const supabase = createClient()
    await supabase.from("job_swipes").insert({ student_id: userId, job_id: job.id, direction })
    if (direction === "right") toast({ title: "Applied! 🎉", description: `You applied for ${job.title}` })
    else if (direction === "saved") toast({ title: "Saved for later" })
    setCurrentIndex(prev => prev + 1)
    setTimeout(() => setSwiping(false), 100)
  }, [userId, swiping, currentIndex, jobs, toast])

  const currentJob = jobs[currentIndex]
  const nextJob = jobs[currentIndex + 1]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center animate-pulse shadow-[0_0_20px_-3px_rgba(247,147,26,0.6)]">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <p className="font-data text-xs tracking-widest uppercase text-[#94A3B8]">Finding jobs for you...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-white">Discover</h1>
          <p className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8] mt-0.5">Swipe right to apply</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center shadow-[0_0_15px_-3px_rgba(247,147,26,0.6)]">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
      </div>

      {currentIndex >= jobs.length ? (
        <div className="flex flex-col items-center gap-5 text-center py-24">
          <div className="w-20 h-20 rounded-3xl bg-[#F7931A]/15 border border-[#F7931A]/30 flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-[#F7931A]" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-xl text-white">All caught up!</h3>
            <p className="font-body text-[#94A3B8] text-sm mt-1 max-w-xs">Check back later for new opportunities.</p>
          </div>
          <button onClick={loadJobs}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#EA580C] to-[#F7931A] text-white font-body font-semibold text-sm shadow-[0_0_20px_-5px_rgba(234,88,12,0.5)] hover:shadow-[0_0_30px_-5px_rgba(247,147,26,0.7)] transition-all duration-300">
            Refresh Jobs
          </button>
        </div>
      ) : (
        /* Desktop: two-column. Mobile: single column centered */
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Card + buttons */}
          <div className="flex flex-col items-center gap-5 w-full lg:w-auto lg:sticky lg:top-8">
            <div className="relative w-full max-w-sm mx-auto">
              {nextJob && (
                <div className="absolute inset-0 scale-[0.96] -translate-y-3 opacity-60 pointer-events-none rounded-3xl overflow-hidden">
                  <JobCard job={nextJob} />
                </div>
              )}
              <SwipeCard key={currentJob.id} onSwipeLeft={() => handleSwipe("left")} onSwipeRight={() => handleSwipe("right")} disabled={swiping}>
                <JobCard job={currentJob} />
              </SwipeCard>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center items-center gap-5">
              <button onClick={() => handleSwipe("left")} disabled={swiping}
                className="h-14 w-14 rounded-full bg-[#0F1115] border-2 border-red-500/30 shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)] flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/60 hover:shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)] transition-all duration-200 active:scale-90">
                <X className="h-7 w-7 text-red-400" />
              </button>
              <button onClick={() => handleSwipe("saved")} disabled={swiping}
                className="h-12 w-12 rounded-full bg-[#0F1115] border-2 border-[#FFD600]/30 shadow-[0_0_12px_-5px_rgba(255,214,0,0.3)] flex items-center justify-center hover:bg-[#FFD600]/10 hover:border-[#FFD600]/60 hover:shadow-[0_0_20px_-5px_rgba(255,214,0,0.5)] transition-all duration-200 active:scale-90">
                <Bookmark className="h-5 w-5 text-[#FFD600]" />
              </button>
              <button onClick={() => handleSwipe("right")} disabled={swiping}
                className="h-14 w-14 rounded-full bg-gradient-to-br from-[#EA580C] to-[#F7931A] shadow-[0_0_20px_-5px_rgba(247,147,26,0.6)] flex items-center justify-center hover:shadow-[0_0_30px_-5px_rgba(247,147,26,0.9)] transition-all duration-200 active:scale-90">
                <Heart className="h-7 w-7 text-white" fill="white" />
              </button>
            </div>
          </div>

          {/* Desktop: upcoming jobs panel */}
          {jobs.slice(currentIndex + 1, currentIndex + 4).length > 0 && (
            <div className="hidden lg:flex flex-col gap-3 flex-1">
              <p className="font-data text-[11px] tracking-widest uppercase text-[#94A3B8]">Up Next</p>
              {jobs.slice(currentIndex + 1, currentIndex + 4).map((job) => (
                <div key={job.id} className="rounded-xl bg-[#0F1115] border border-white/8 p-4 space-y-1 opacity-70">
                  <p className="font-heading font-semibold text-sm text-white">{job.title}</p>
                  <p className="font-body text-xs text-[#94A3B8]">{(job as any).recruiter_profiles?.company_name}</p>
                  <span className="inline-block font-data text-[9px] tracking-wider px-2 py-0.5 rounded-full bg-[#F7931A]/10 border border-[#F7931A]/20 text-[#F7931A]">{job.job_type.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
