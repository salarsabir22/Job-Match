"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Star, Archive, Loader2, Zap } from "lucide-react"
import { getInitials, formatDate } from "@/lib/utils"
import { useToast } from "@/lib/hooks/use-toast"
import { cn } from "@/lib/utils"

export function RecruiterMatchesView({ userId }: { userId: string }) {
  const { toast } = useToast()
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"all" | "starred" | "archived">("all")

  useEffect(() => { loadMatches() }, [])

  const loadMatches = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("matches").select(`*, jobs(title, job_type), profiles!matches_student_id_fkey(id, full_name, avatar_url, bio), student_profiles(skills, university), conversations(id)`).eq("recruiter_id", userId).order("created_at", { ascending: false })
    setMatches(data || [])
    setLoading(false)
  }

  const toggleShortlist = async (matchId: string, current: boolean) => {
    const supabase = createClient()
    await supabase.from("matches").update({ is_shortlisted: !current }).eq("id", matchId)
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, is_shortlisted: !current } : m))
    toast({ title: current ? "Removed from shortlist" : "Added to shortlist" })
  }

  const toggleArchive = async (matchId: string, current: boolean) => {
    const supabase = createClient()
    await supabase.from("matches").update({ is_archived: !current }).eq("id", matchId)
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, is_archived: !current } : m))
    toast({ title: current ? "Unarchived" : "Archived" })
  }

  const active = matches.filter(m => !m.is_archived)
  const shortlisted = matches.filter(m => m.is_shortlisted && !m.is_archived)
  const archived = matches.filter(m => m.is_archived)

  const displayed = tab === "all" ? active : tab === "starred" ? shortlisted : archived

  const MatchCard = ({ match }: { match: any }) => {
    const profile = match.profiles
    const convId = match.conversations?.[0]?.id
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-[#0F1115] border border-white/8 hover:border-[#F7931A]/20 transition-all duration-200">
        <Avatar className="h-12 w-12 shrink-0 border border-white/10">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback className="bg-[#030304] text-[#F7931A] text-sm font-bold">
            {getInitials(profile?.full_name || "?")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-sm text-white">{profile?.full_name}</p>
          <p className="font-body text-xs text-[#94A3B8] truncate">{match.jobs?.title}</p>
          {match.student_profiles?.university && (
            <p className="font-data text-[10px] text-[#94A3B8]">{match.student_profiles.university}</p>
          )}
          <p className="font-data text-[10px] text-[#94A3B8] mt-0.5">{formatDate(match.created_at)}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          {convId && (
            <Link href={`/chat/${convId}`}
              className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center shadow-[0_0_10px_-3px_rgba(247,147,26,0.5)] hover:shadow-[0_0_15px_-3px_rgba(247,147,26,0.7)] transition-all">
              <MessageCircle className="h-3.5 w-3.5 text-white" />
            </Link>
          )}
          <button onClick={() => toggleShortlist(match.id, match.is_shortlisted)}
            className={cn("h-8 w-8 rounded-lg border flex items-center justify-center transition-all", match.is_shortlisted ? "border-[#FFD600]/50 bg-[#FFD600]/15 text-[#FFD600]" : "border-white/10 text-[#94A3B8] hover:border-white/20")}>
            <Star className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => toggleArchive(match.id, match.is_archived)}
            className="h-8 w-8 rounded-lg border border-white/10 text-[#94A3B8] flex items-center justify-center hover:border-white/20 transition-all">
            <Archive className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#030304]">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center animate-pulse shadow-[0_0_20px_-3px_rgba(247,147,26,0.6)]">
          <Zap className="h-5 w-5 text-white" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-3xl text-white">Matches</h1>
        <p className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8] mt-0.5">{matches.length} total matches</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#0F1115] border border-white/8 rounded-xl">
        {([
          { key: "all", label: `All (${active.length})` },
          { key: "starred", label: `Starred (${shortlisted.length})` },
          { key: "archived", label: `Archived (${archived.length})` },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("flex-1 py-1.5 rounded-lg font-data text-[10px] tracking-wider uppercase transition-all duration-200", tab === t.key ? "bg-[#F7931A]/20 text-[#F7931A] border border-[#F7931A]/30" : "text-[#94A3B8] hover:text-white")}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {!displayed.length ? (
          <div className="text-center py-16 space-y-3">
            <Heart className="h-10 w-10 text-[#94A3B8] mx-auto" />
            <p className="font-body text-sm text-[#94A3B8]">
              {tab === "all" ? "No matches yet. Swipe on candidates to get matches." : tab === "starred" ? "Star candidates to shortlist them." : "Archived candidates appear here."}
            </p>
          </div>
        ) : displayed.map(m => <MatchCard key={m.id} match={m} />)}
      </div>
    </div>
  )
}
