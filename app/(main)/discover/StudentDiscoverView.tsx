"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { SwipeCard } from "@/components/swipe/SwipeCard"
import { JobCard } from "@/components/swipe/JobCard"
import { useToast } from "@/lib/hooks/use-toast"
import {
  X, Heart, Bookmark, Sparkles, Zap, TrendingUp, Target, CheckCircle2,
  Building2, MapPin, Wifi, Calendar, ExternalLink, Briefcase, CheckCircle,
} from "lucide-react"
import type { Job } from "@/types"

interface Stats {
  applied: number
  saved: number
  matches: number
  total: number
}

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

  useEffect(() => { loadJobs() }, [])

  const loadJobs = async () => {
    setLoading(true)
    const supabase = createClient()

    const [swipesRes, matchesRes] = await Promise.all([
      supabase.from("job_swipes").select("job_id, direction").eq("student_id", userId),
      supabase.from("matches").select("id", { count: "exact", head: true }).eq("student_id", userId),
    ])

    const swipes = swipesRes.data || []
    const swipedJobIds = swipes.map((s: any) => s.job_id)
    const applied = swipes.filter((s: any) => s.direction === "right").length
    const saved   = swipes.filter((s: any) => s.direction === "saved").length

    setStats({ applied, saved, matches: matchesRes.count || 0, total: swipes.length })

    let query = supabase
      .from("jobs")
      .select("*, recruiter_profiles(id, company_name, logo_url, website_url, description)")
      .eq("is_active", true)

    if (swipedJobIds.length > 0) {
      query = query.not("id", "in", `(${swipedJobIds.join(",")})`)
    }

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

  const company = currentJob ? (currentJob as any).recruiter_profiles : null

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-white">Discover Jobs</h1>
          <p className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8] mt-0.5">
            Swipe right to apply · {remaining > 0 ? `${remaining} jobs waiting` : "All caught up"}
          </p>
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center shadow-[0_0_15px_-3px_rgba(247,147,26,0.6)]">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Applied",  value: stats.applied,  icon: Heart,        color: "#F7931A" },
          { label: "Saved",    value: stats.saved,    icon: Bookmark,     color: "#FFD600" },
          { label: "Matches",  value: stats.matches,  icon: CheckCircle2, color: "#22c55e" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl bg-[#0F1115] border border-white/8 p-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
              <Icon className="h-3.5 w-3.5" style={{ color }} />
            </div>
            <div>
              <p className="font-heading font-bold text-lg leading-none" style={{ color }}>{value}</p>
              <p className="font-data text-[9px] tracking-wider uppercase text-[#94A3B8] mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {currentIndex >= jobs.length ? (
        /* ── All caught up ── */
        <div className="flex flex-col items-center gap-5 text-center py-16">
          <div className="w-20 h-20 rounded-3xl bg-[#F7931A]/15 border border-[#F7931A]/30 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-[#F7931A]" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-xl text-white">All caught up!</h3>
            <p className="font-body text-[#94A3B8] text-sm mt-1 max-w-xs">
              You&apos;ve reviewed all available jobs. Check back later for new opportunities.
            </p>
          </div>
          <div className="rounded-xl bg-[#0F1115] border border-white/8 p-5 w-full max-w-sm text-left space-y-3">
            <p className="font-data text-[10px] tracking-widest uppercase text-[#94A3B8]">Session summary</p>
            {[
              { label: "Jobs applied to", value: stats.applied, color: "#F7931A" },
              { label: "Jobs saved",       value: stats.saved,   color: "#FFD600" },
              { label: "Total matches",    value: stats.matches, color: "#22c55e" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <p className="font-body text-sm text-[#94A3B8]">{label}</p>
                <p className="font-heading font-bold text-sm" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
          <button onClick={loadJobs}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#EA580C] to-[#F7931A] text-white font-body font-semibold text-sm shadow-[0_0_20px_-5px_rgba(234,88,12,0.5)] hover:shadow-[0_0_30px_-5px_rgba(247,147,26,0.7)] transition-all duration-300">
            Refresh Jobs
          </button>
        </div>
      ) : (
        /* ── Two-column desktop layout ── */
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">

          {/* Left: swipe card + action buttons */}
          <div className="flex flex-col items-center gap-5 lg:sticky lg:top-6">
            <div className="relative w-full max-w-sm mx-auto">
              {nextJob && (
                <div className="absolute inset-0 scale-[0.96] -translate-y-3 opacity-60 pointer-events-none rounded-3xl overflow-hidden">
                  <JobCard job={nextJob} />
                </div>
              )}
              <SwipeCard
                key={currentJob.id}
                onSwipeLeft={() => handleSwipe("left")}
                onSwipeRight={() => handleSwipe("right")}
                disabled={swiping}
              >
                <JobCard job={currentJob} />
              </SwipeCard>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center items-center gap-5">
              <button onClick={() => handleSwipe("left")} disabled={swiping} title="Pass"
                className="h-14 w-14 rounded-full bg-[#0F1115] border-2 border-red-500/30 shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)] flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/60 transition-all duration-200 active:scale-90">
                <X className="h-7 w-7 text-red-400" />
              </button>
              <button onClick={() => handleSwipe("saved")} disabled={swiping} title="Save for later"
                className="h-12 w-12 rounded-full bg-[#0F1115] border-2 border-[#FFD600]/30 shadow-[0_0_12px_-5px_rgba(255,214,0,0.3)] flex items-center justify-center hover:bg-[#FFD600]/10 hover:border-[#FFD600]/60 transition-all duration-200 active:scale-90">
                <Bookmark className="h-5 w-5 text-[#FFD600]" />
              </button>
              <button onClick={() => handleSwipe("right")} disabled={swiping} title="Apply"
                className="h-14 w-14 rounded-full bg-gradient-to-br from-[#EA580C] to-[#F7931A] shadow-[0_0_20px_-5px_rgba(247,147,26,0.6)] flex items-center justify-center hover:shadow-[0_0_30px_-5px_rgba(247,147,26,0.9)] transition-all duration-200 active:scale-90">
                <Heart className="h-7 w-7 text-white" fill="white" />
              </button>
            </div>
            <div className="flex items-center gap-4 font-data text-[9px] tracking-wider uppercase text-[#94A3B8]">
              <span className="text-red-400">← Pass</span>
              <span className="text-[#FFD600]">↑ Save</span>
              <span className="text-[#F7931A]">→ Apply</span>
            </div>
          </div>

          {/* Right: job detail panel */}
          <div className="space-y-4">
            {/* Job detail */}
            <div className="rounded-2xl bg-[#0F1115] border border-white/8 overflow-hidden">
              {/* Header */}
              <div className="h-36 bg-gradient-to-br from-[#1a0f00] via-[#2a1200] to-[#0a0600] relative overflow-hidden flex items-end px-6 pb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-[#F7931A]/20 via-[#EA580C]/10 to-transparent pointer-events-none" />
                <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-[#F7931A]/8 blur-2xl" />
                <div className="flex items-end gap-4 relative z-10">
                  {company?.logo_url ? (
                    <img src={company.logo_url} alt={company.company_name}
                      className="h-14 w-14 rounded-xl object-cover border border-white/10 shadow-[0_0_20px_-5px_rgba(247,147,26,0.4)] shrink-0" />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center shrink-0 shadow-[0_0_20px_-5px_rgba(247,147,26,0.5)]">
                      <Building2 className="h-7 w-7 text-white" />
                    </div>
                  )}
                  <div>
                    <h2 className="font-heading font-bold text-xl text-white leading-tight">{currentJob.title}</h2>
                    {company?.company_name && (
                      <p className="font-body text-sm text-[#94A3B8] mt-0.5 flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 shrink-0" />
                        {company.company_name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Meta */}
                <div className="flex flex-wrap gap-2">
                  <span className="font-data text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-full bg-[#F7931A]/10 border border-[#F7931A]/20 text-[#F7931A]">
                    {JOB_TYPE_LABEL[currentJob.job_type] ?? currentJob.job_type}
                  </span>
                  {currentJob.is_remote ? (
                    <span className="font-data text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 flex items-center gap-1">
                      <Wifi className="h-3 w-3" /> Remote
                    </span>
                  ) : currentJob.location ? (
                    <span className="font-data text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#94A3B8] flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {currentJob.location}
                    </span>
                  ) : null}
                </div>

                {/* Description */}
                {currentJob.description && (
                  <div>
                    <p className="font-data text-[10px] tracking-widest uppercase text-[#94A3B8] mb-2">About the role</p>
                    <p className="font-body text-sm text-[#CBD5E1] leading-relaxed">{currentJob.description}</p>
                  </div>
                )}

                {/* Required skills */}
                {(currentJob.required_skills?.length ?? 0) > 0 && (
                  <div>
                    <p className="font-data text-[10px] tracking-widest uppercase text-[#94A3B8] mb-2">Required skills</p>
                    <div className="flex flex-wrap gap-2">
                      {currentJob.required_skills.map((s) => (
                        <span key={s} className="font-data text-[10px] tracking-wide px-2.5 py-1 rounded-md bg-[#F7931A]/10 border border-[#F7931A]/25 text-[#F7931A]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nice to have */}
                {(currentJob.nice_to_have_skills?.length ?? 0) > 0 && (
                  <div>
                    <p className="font-data text-[10px] tracking-widest uppercase text-[#94A3B8] mb-2">Nice to have</p>
                    <div className="flex flex-wrap gap-2">
                      {currentJob.nice_to_have_skills.map((s) => (
                        <span key={s} className="font-data text-[10px] tracking-wide px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[#94A3B8]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Company description */}
                {company?.description && (
                  <div>
                    <p className="font-data text-[10px] tracking-widest uppercase text-[#94A3B8] mb-2">About {company.company_name}</p>
                    <p className="font-body text-sm text-[#94A3B8] leading-relaxed">{company.description}</p>
                  </div>
                )}

                {/* Company website */}
                {company?.website_url && (
                  <a href={company.website_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-body text-xs text-[#F7931A] hover:text-[#FFD600] transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Visit {company.company_name}
                  </a>
                )}

                {/* Action buttons in detail panel */}
                <div className="flex gap-3 pt-2 border-t border-white/6">
                  <button onClick={() => handleSwipe("left")} disabled={swiping}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 hover:bg-red-500/15 transition-all font-body text-sm font-medium">
                    <X className="h-4 w-4" /> Pass
                  </button>
                  <button onClick={() => handleSwipe("saved")} disabled={swiping}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FFD600]/8 border border-[#FFD600]/20 text-[#FFD600] hover:bg-[#FFD600]/15 transition-all font-body text-sm font-medium">
                    <Bookmark className="h-4 w-4" /> Save
                  </button>
                  <button onClick={() => handleSwipe("right")} disabled={swiping}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#EA580C] to-[#F7931A] text-white hover:opacity-90 transition-all font-body text-sm font-semibold shadow-[0_0_20px_-5px_rgba(247,147,26,0.5)]">
                    <Heart className="h-4 w-4" fill="currentColor" /> Apply Now
                  </button>
                </div>
              </div>
            </div>

            {/* Up next queue */}
            {jobs.slice(currentIndex + 1, currentIndex + 4).length > 0 && (
              <div className="rounded-2xl bg-[#0F1115] border border-white/8 p-4 space-y-3">
                <p className="font-data text-[10px] tracking-widest uppercase text-[#94A3B8]">Up Next</p>
                <div className="space-y-2">
                  {jobs.slice(currentIndex + 1, currentIndex + 4).map((job, i) => {
                    const co = (job as any).recruiter_profiles
                    return (
                      <div key={job.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0A0B0E] border border-white/5 opacity-70">
                        {co?.logo_url ? (
                          <img src={co.logo_url} alt="" className="h-8 w-8 rounded-lg object-cover border border-white/10 shrink-0" />
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#EA580C]/60 to-[#F7931A]/60 flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4 text-white/70" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm font-medium text-white truncate">{job.title}</p>
                          <p className="font-data text-[10px] text-[#94A3B8] truncate">{co?.company_name ?? "Company"}</p>
                        </div>
                        <span className="font-data text-[9px] text-[#94A3B8] shrink-0">#{i + 2}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="rounded-2xl bg-[#0F1115] border border-white/8 p-4 space-y-2">
              <p className="font-data text-[10px] tracking-widest uppercase text-[#94A3B8]">How matching works</p>
              {[
                { color: "#F7931A", text: "Swipe right to apply — the recruiter sees your profile immediately" },
                { color: "#22c55e", text: "A match happens when the recruiter also likes your profile" },
                { color: "#3B82F6", text: "Matches unlock a private chat to discuss opportunities" },
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
