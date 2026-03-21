"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Star, Archive, Zap, TrendingUp, ArrowRight, GraduationCap } from "lucide-react"
import { getInitials, formatDate } from "@/lib/utils"
import { useToast } from "@/lib/hooks/use-toast"
import { cn } from "@/lib/utils"

interface OverallStats {
  totalMatches: number
  shortlisted: number
  inConversation: number
  archived: number
}

type MatchRow = {
  id: string
  created_at: string
  is_shortlisted?: boolean
  is_archived?: boolean
  jobs?: { title?: string | null; job_type?: string | null } | null
  profiles?: {
    id?: string
    full_name?: string | null
    avatar_url?: string | null
    bio?: string | null
    student_profiles?:
      | {
          skills?: string[] | null
          university?: string | null
          degree?: string | null
          graduation_year?: number | string | null
        }
      | {
          skills?: string[] | null
          university?: string | null
          degree?: string | null
          graduation_year?: number | string | null
        }[]
      | null
  } | null
  conversations?: { id: string }[] | { id: string } | null
}

export function RecruiterMatchesView({ userId }: { userId: string }) {
  const { toast } = useToast()
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"all" | "starred" | "archived">("all")
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalMatches: 0, shortlisted: 0, inConversation: 0, archived: 0,
  })

  async function loadMatches() {
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

    const all = (data || []) as MatchRow[]
    setMatches(all)
    setOverallStats({
      totalMatches: all.length,
      shortlisted: all.filter((m) => m.is_shortlisted && !m.is_archived).length,
      inConversation: all.filter((m) =>
        Array.isArray(m.conversations) ? m.conversations.length > 0 : !!(m.conversations && typeof m.conversations === "object" && "id" in m.conversations)
      ).length,
      archived: all.filter((m) => m.is_archived).length,
    })
    setLoading(false)
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadMatches()
    })
  }, [])

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

  const MatchCard = ({ match }: { match: MatchRow }) => {
    const profile = match.profiles
    const spRaw = match.profiles?.student_profiles
    const sp = Array.isArray(spRaw) ? spRaw[0] : spRaw
    const convId = Array.isArray(match.conversations) ? match.conversations?.[0]?.id : match.conversations?.id
    const skills = sp?.skills?.slice(0, 3) || []

    return (
      <div className="rounded-xl bg-white border border-black/10 hover:border-[#FAFAFA]/20 transition-all duration-200 overflow-hidden">
        <div className="p-4 flex items-start gap-3">
          <Avatar className="h-12 w-12 shrink-0 border border-black/10">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-white text-neutral-900 text-sm font-bold">
              {getInitials(profile?.full_name || "?")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-heading font-semibold text-sm text-black truncate">{profile?.full_name}</p>
                <p className="font-body text-xs text-neutral-700 truncate">{match.jobs?.title}</p>
                {sp?.university && (
                  <p className="font-data text-[10px] text-neutral-700 flex items-center gap-1 mt-0.5">
                    <GraduationCap className="h-3 w-3" />
                    {sp.university}{sp.graduation_year ? ` · ${sp.graduation_year}` : ""}
                  </p>
                )}
              </div>
              <p className="font-data text-[9px] text-neutral-700 shrink-0">{formatDate(match.created_at)}</p>
            </div>

            {/* Skills */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {skills.map((s: string) => (
                  <span key={s} className="font-data text-[9px] tracking-wider px-1.5 py-0.5 rounded-full bg-[#FAFAFA]/10 border border-[#FAFAFA]/20 text-neutral-900">
                    {s}
                  </span>
                ))}
                {(sp?.skills?.length || 0) > 3 && (
                  <span className="font-data text-[9px] px-1.5 py-0.5 rounded-full border border-black/10 text-neutral-700">
                    +{(sp?.skills?.length || 0) - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action row */}
        <div className="px-4 pb-3 flex items-center justify-between gap-3 border-t border-black/10 pt-3">
          <div className="flex items-center gap-2">
            {match.is_shortlisted && (
              <span className="font-data text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-[#D4D4D4]/10 border border-[#D4D4D4]/25 text-[#D4D4D4]">
                ★ Shortlisted
              </span>
            )}
            {convId && (
              <span className="font-data text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-neutral-500/10 border border-neutral-500/25 text-neutral-400">
                In chat
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => toggleShortlist(match.id, !!match.is_shortlisted)}
              title={match.is_shortlisted ? "Remove from shortlist" : "Shortlist"}
              className={cn(
                "h-8 w-8 rounded-lg border flex items-center justify-center transition-all",
                match.is_shortlisted
                  ? "border-[#D4D4D4]/50 bg-[#D4D4D4]/15 text-[#D4D4D4]"
                  : "border-black/10 text-neutral-700 hover:border-[#D4D4D4]/40 hover:text-neutral-600"
              )}
            >
              <Star className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => toggleArchive(match.id, !!match.is_archived)}
              title={match.is_archived ? "Unarchive" : "Archive"}
              className="h-8 w-8 rounded-lg border border-black/10 text-neutral-700 flex items-center justify-center hover:border-white/20 transition-all"
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
            {convId ? (
              <Link
                href={`/chat/${convId}`}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-black text-white font-body font-semibold text-xs shadow-[0_0_10px_-3px_rgba(255,255,255,0.5)] hover:shadow-[0_0_15px_-3px_rgba(255,255,255,0.7)] transition-all"
              >
                <MessageCircle className="h-3 w-3" />Chat
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-black/10 text-neutral-700 font-data text-[9px] tracking-wider uppercase">
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
        <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center animate-pulse shadow-[0_0_20px_-3px_rgba(255,255,255,0.6)]">
          <Zap className="h-5 w-5 text-black" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-3xl text-black">Matches</h1>
        <p className="font-data text-[11px] tracking-wider uppercase text-neutral-700 mt-0.5">
          {matches.length} total candidate match{matches.length !== 1 ? "es" : ""}
        </p>
      </div>

      {/* Analytics stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Matches", value: overallStats.totalMatches, icon: Heart, color: "#FAFAFA" },
          { label: "Shortlisted", value: overallStats.shortlisted, icon: Star, color: "#D4D4D4" },
          { label: "In Conversation", value: overallStats.inConversation, icon: MessageCircle, color: "#D4D4D4" },
          { label: "Archived", value: overallStats.archived, icon: Archive, color: "#94A3B8" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl bg-white border border-black/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-data text-[9px] tracking-wider uppercase text-neutral-700">{label}</p>
              <Icon className="h-3.5 w-3.5" style={{ color }} />
            </div>
            <p className="font-heading font-bold text-2xl" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      {matches.length > 0 && (
        <div className="rounded-xl bg-white border border-black/10 p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-neutral-900" />
            <p className="font-data text-[11px] tracking-wider uppercase text-neutral-700">Candidate Pipeline</p>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { label: "Matched", value: matches.length, color: "#FAFAFA" },
              { label: "Active", value: active.length, color: "#D4D4D4" },
              { label: "Shortlisted", value: shortlisted.length, color: "#D4D4D4" },
              { label: "In Chat", value: overallStats.inConversation, color: "#A3A3A3" },
            ].map(({ label, value, color }, i, arr) => (
              <div key={label} className="flex items-center gap-2 shrink-0">
                <div className="text-center min-w-[60px]">
                  <p className="font-heading font-bold text-xl" style={{ color }}>{value}</p>
                  <p className="font-data text-[9px] tracking-wider uppercase text-neutral-700">{label}</p>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-neutral-700/30 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white border border-black/10 rounded-xl">
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
                ? "bg-[#FAFAFA]/20 text-neutral-900 border border-[#FAFAFA]/30"
                : "text-neutral-700 hover:text-black"
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
            <Heart className="h-10 w-10 text-neutral-700 mx-auto" />
            <p className="font-body text-sm text-neutral-700">
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
