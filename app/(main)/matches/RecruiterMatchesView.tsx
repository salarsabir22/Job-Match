"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Star, Archive, Zap, TrendingUp, Target, Users, ArrowRight, GraduationCap, ChevronRight } from "lucide-react"
import { getInitials, formatDate } from "@/lib/utils"
import { useToast } from "@/lib/hooks/use-toast"
import { cn } from "@/lib/utils"

interface OverallStats {
  totalMatches: number
  shortlisted: number
  inConversation: number
  archived: number
}

export function RecruiterMatchesView({ userId }: { userId: string }) {
  const { toast } = useToast()
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"all" | "starred" | "archived">("all")
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalMatches: 0, shortlisted: 0, inConversation: 0, archived: 0,
  })

  useEffect(() => { loadMatches() }, [])

  const loadMatches = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("matches")
      .select(`
        *,
        jobs(title, job_type),
        profiles!matches_student_id_fkey(id, full_name, avatar_url, bio, student_profiles(skills, university, degree, graduation_year)),
        conversations(id)
      `)
      .eq("recruiter_id", userId)
      .order("created_at", { ascending: false })

    const all = data || []
    setMatches(all)
    setOverallStats({
      totalMatches: all.length,
      shortlisted: all.filter((m: any) => m.is_shortlisted && !m.is_archived).length,
      inConversation: all.filter((m: any) => m.conversations?.length > 0).length,
      archived: all.filter((m: any) => m.is_archived).length,
    })
    setLoading(false)
  }

  const toggleShortlist = async (matchId: string, current: boolean) => {
    const supabase = createClient()
    await supabase.from("matches").update({ is_shortlisted: !current }).eq("id", matchId)
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, is_shortlisted: !current } : m))
    setOverallStats(prev => ({
      ...prev,
      shortlisted: !current ? prev.shortlisted + 1 : prev.shortlisted - 1,
    }))
    toast({ title: current ? "Removed from shortlist" : "Added to shortlist" })
  }

  const toggleArchive = async (matchId: string, current: boolean) => {
    const supabase = createClient()
    await supabase.from("matches").update({ is_archived: !current }).eq("id", matchId)
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, is_archived: !current } : m))
    setOverallStats(prev => ({
      ...prev,
      archived: !current ? prev.archived + 1 : prev.archived - 1,
    }))
    toast({ title: current ? "Unarchived" : "Archived" })
  }

  const active = matches.filter(m => !m.is_archived)
  const shortlisted = matches.filter(m => m.is_shortlisted && !m.is_archived)
  const archived = matches.filter(m => m.is_archived)
  const displayed = tab === "all" ? active : tab === "starred" ? shortlisted : archived

  const MatchCard = ({ match }: { match: any }) => {
    const profile = match.profiles
    const sp = match.profiles?.student_profiles
    const convId = match.conversations?.[0]?.id
    const skills = sp?.skills?.slice(0, 3) || []

    return (
      <div className="rounded-xl bg-[#0F1115] border border-white/8 hover:border-[#F7931A]/20 transition-all duration-200 overflow-hidden">
        <div className="p-4 flex items-start gap-3">
          <Avatar className="h-12 w-12 shrink-0 border border-white/10">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-[#030304] text-[#F7931A] text-sm font-bold">
              {getInitials(profile?.full_name || "?")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-heading font-semibold text-sm text-white truncate">{profile?.full_name}</p>
                <p className="font-body text-xs text-[#94A3B8] truncate">{match.jobs?.title}</p>
                {sp?.university && (
                  <p className="font-data text-[10px] text-[#94A3B8] flex items-center gap-1 mt-0.5">
                    <GraduationCap className="h-3 w-3" />
                    {sp.university}{sp.graduation_year ? ` · ${sp.graduation_year}` : ""}
                  </p>
                )}
              </div>
              <p className="font-data text-[9px] text-[#94A3B8] shrink-0">{formatDate(match.created_at)}</p>
            </div>

            {/* Skills */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {skills.map((s: string) => (
                  <span key={s} className="font-data text-[9px] tracking-wider px-1.5 py-0.5 rounded-full bg-[#F7931A]/10 border border-[#F7931A]/20 text-[#F7931A]">
                    {s}
                  </span>
                ))}
                {(sp?.skills?.length || 0) > 3 && (
                  <span className="font-data text-[9px] px-1.5 py-0.5 rounded-full border border-white/10 text-[#94A3B8]">
                    +{sp.skills.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action row */}
        <div className="px-4 pb-3 flex items-center justify-between gap-3 border-t border-white/5 pt-3">
          <div className="flex items-center gap-2">
            {match.is_shortlisted && (
              <span className="font-data text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-[#FFD600]/10 border border-[#FFD600]/25 text-[#FFD600]">
                ★ Shortlisted
              </span>
            )}
            {convId && (
              <span className="font-data text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/25 text-green-400">
                In chat
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => toggleShortlist(match.id, match.is_shortlisted)}
              title={match.is_shortlisted ? "Remove from shortlist" : "Shortlist"}
              className={cn(
                "h-8 w-8 rounded-lg border flex items-center justify-center transition-all",
                match.is_shortlisted
                  ? "border-[#FFD600]/50 bg-[#FFD600]/15 text-[#FFD600]"
                  : "border-white/10 text-[#94A3B8] hover:border-[#FFD600]/40 hover:text-[#FFD600]"
              )}
            >
              <Star className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => toggleArchive(match.id, match.is_archived)}
              title={match.is_archived ? "Unarchive" : "Archive"}
              className="h-8 w-8 rounded-lg border border-white/10 text-[#94A3B8] flex items-center justify-center hover:border-white/20 transition-all"
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
            {convId ? (
              <Link
                href={`/chat/${convId}`}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-gradient-to-r from-[#EA580C] to-[#F7931A] text-white font-body font-semibold text-xs shadow-[0_0_10px_-3px_rgba(247,147,26,0.5)] hover:shadow-[0_0_15px_-3px_rgba(247,147,26,0.7)] transition-all"
              >
                <MessageCircle className="h-3 w-3" />Chat
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/8 text-[#94A3B8] font-data text-[9px] tracking-wider uppercase">
                No chat yet
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center animate-pulse shadow-[0_0_20px_-3px_rgba(247,147,26,0.6)]">
          <Zap className="h-5 w-5 text-white" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-3xl text-white">Matches</h1>
        <p className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8] mt-0.5">
          {matches.length} total candidate match{matches.length !== 1 ? "es" : ""}
        </p>
      </div>

      {/* Analytics stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Matches", value: overallStats.totalMatches, icon: Heart, color: "#F7931A" },
          { label: "Shortlisted", value: overallStats.shortlisted, icon: Star, color: "#FFD600" },
          { label: "In Conversation", value: overallStats.inConversation, icon: MessageCircle, color: "#22c55e" },
          { label: "Archived", value: overallStats.archived, icon: Archive, color: "#94A3B8" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl bg-[#0F1115] border border-white/8 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-data text-[9px] tracking-wider uppercase text-[#94A3B8]">{label}</p>
              <Icon className="h-3.5 w-3.5" style={{ color }} />
            </div>
            <p className="font-heading font-bold text-2xl" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      {matches.length > 0 && (
        <div className="rounded-xl bg-[#0F1115] border border-white/8 p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-[#F7931A]" />
            <p className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8]">Candidate Pipeline</p>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { label: "Matched", value: matches.length, color: "#F7931A" },
              { label: "Active", value: active.length, color: "#FFD600" },
              { label: "Shortlisted", value: shortlisted.length, color: "#22c55e" },
              { label: "In Chat", value: overallStats.inConversation, color: "#60a5fa" },
            ].map(({ label, value, color }, i, arr) => (
              <div key={label} className="flex items-center gap-2 shrink-0">
                <div className="text-center min-w-[60px]">
                  <p className="font-heading font-bold text-xl" style={{ color }}>{value}</p>
                  <p className="font-data text-[9px] tracking-wider uppercase text-[#94A3B8]">{label}</p>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-[#94A3B8]/30 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#0F1115] border border-white/8 rounded-xl">
        {([
          { key: "all", label: `All (${active.length})` },
          { key: "starred", label: `Shortlisted (${shortlisted.length})` },
          { key: "archived", label: `Archived (${archived.length})` },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 py-1.5 rounded-lg font-data text-[10px] tracking-wider uppercase transition-all duration-200",
              tab === t.key
                ? "bg-[#F7931A]/20 text-[#F7931A] border border-[#F7931A]/30"
                : "text-[#94A3B8] hover:text-white"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Match cards */}
      <div className="space-y-3">
        {!displayed.length ? (
          <div className="text-center py-16 space-y-3">
            <Heart className="h-10 w-10 text-[#94A3B8] mx-auto" />
            <p className="font-body text-sm text-[#94A3B8]">
              {tab === "all"
                ? "No matches yet. Swipe on candidates in the Discover tab to get started."
                : tab === "starred"
                ? "Star candidates you want to prioritise — they'll appear here."
                : "Archived candidates appear here."}
            </p>
          </div>
        ) : (
          displayed.map(m => <MatchCard key={m.id} match={m} />)
        )}
      </div>
    </div>
  )
}
