"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Archive } from "lucide-react"
import { getInitials, formatDate, cn } from "@/lib/utils"
import { useToast } from "@/lib/hooks/use-toast"

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
    totalMatches: 0,
    shortlisted: 0,
    inConversation: 0,
    archived: 0,
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
        Array.isArray(m.conversations)
          ? m.conversations.length > 0
          : !!(m.conversations && typeof m.conversations === "object" && "id" in m.conversations)
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
    setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, is_shortlisted: !current } : m)))
    setOverallStats((prev) => ({
      ...prev,
      shortlisted: !current ? prev.shortlisted + 1 : prev.shortlisted - 1,
    }))
    toast({ title: current ? "Removed from shortlist" : "Added to shortlist" })
  }

  const toggleArchive = async (matchId: string, current: boolean) => {
    const supabase = createClient()
    await supabase.from("matches").update({ is_archived: !current }).eq("id", matchId)
    setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, is_archived: !current } : m)))
    setOverallStats((prev) => ({
      ...prev,
      archived: !current ? prev.archived + 1 : prev.archived - 1,
    }))
    toast({ title: current ? "Unarchived" : "Archived" })
  }

  const active = matches.filter((m) => !m.is_archived)
  const shortlisted = matches.filter((m) => m.is_shortlisted && !m.is_archived)
  const archived = matches.filter((m) => m.is_archived)
  const displayed = tab === "all" ? active : tab === "starred" ? shortlisted : archived

  const MatchCard = ({ match }: { match: MatchRow }) => {
    const profile = match.profiles
    const spRaw = match.profiles?.student_profiles
    const sp = Array.isArray(spRaw) ? spRaw[0] : spRaw
    const convId = Array.isArray(match.conversations)
      ? match.conversations?.[0]?.id
      : match.conversations?.id
    const skills = sp?.skills?.slice(0, 3) || []

    const schoolLine = [sp?.university, sp?.graduation_year].filter(Boolean).join(" · ")

    return (
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden transition hover:border-neutral-300">
        <div className="p-4 sm:p-5 flex items-start gap-4">
          <Avatar className="h-12 w-12 shrink-0 ring-1 ring-neutral-200">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-neutral-100 text-neutral-800 text-sm font-semibold">
              {getInitials(profile?.full_name || "?")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-heading font-semibold text-sm text-neutral-950 truncate">{profile?.full_name}</p>
                <p className="font-body text-xs text-neutral-500 truncate mt-0.5">{match.jobs?.title}</p>
                {schoolLine && (
                  <p className="font-body text-[11px] text-neutral-500 mt-1 truncate">{schoolLine}</p>
                )}
              </div>
              <time className="font-body text-[11px] text-neutral-400 shrink-0 tabular-nums">
                {formatDate(match.created_at)}
              </time>
            </div>

            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {skills.map((s: string) => (
                  <span
                    key={s}
                    className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-body text-[11px] text-neutral-700"
                  >
                    {s}
                  </span>
                ))}
                {(sp?.skills?.length || 0) > 3 && (
                  <span className="rounded-md border border-neutral-100 px-2 py-0.5 font-body text-[11px] text-neutral-500">
                    +{(sp?.skills?.length || 0) - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-5 pb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-neutral-100 pt-4">
          <div className="flex flex-wrap gap-2">
            {match.is_shortlisted && (
              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 font-body text-[11px] font-medium text-neutral-700">
                Shortlisted
              </span>
            )}
            {convId && (
              <span className="rounded-full border border-neutral-200 px-2.5 py-0.5 font-body text-[11px] text-neutral-600">
                In chat
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => toggleShortlist(match.id, !!match.is_shortlisted)}
              aria-label={match.is_shortlisted ? "Remove from shortlist" : "Add to shortlist"}
              className={cn(
                "h-9 w-9 rounded-lg border flex items-center justify-center transition-colors",
                match.is_shortlisted
                  ? "border-neutral-300 bg-neutral-100 text-neutral-900"
                  : "border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:bg-neutral-50"
              )}
            >
              <Star className={cn("h-4 w-4", match.is_shortlisted && "fill-neutral-900 text-neutral-900")} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => toggleArchive(match.id, !!match.is_archived)}
              aria-label={match.is_archived ? "Unarchive" : "Archive"}
              className="h-9 w-9 rounded-lg border border-neutral-200 text-neutral-500 flex items-center justify-center hover:bg-neutral-50 transition-colors"
            >
              <Archive className="h-4 w-4" strokeWidth={1.5} />
            </button>
            {convId ? (
              <Link
                href={`/chat/${convId}`}
                className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-neutral-950 text-white font-body text-xs font-medium transition hover:bg-neutral-800"
              >
                Open chat
              </Link>
            ) : (
              <span className="inline-flex items-center h-9 px-3 rounded-lg border border-neutral-100 font-body text-[11px] text-neutral-500">
                No thread yet
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div
          className="h-9 w-9 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin"
          aria-hidden
        />
        <p className="font-body text-sm text-neutral-600">Loading matches…</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2 min-w-0">
        <div className="space-y-1 min-w-0">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-950 sm:text-[1.75rem]">Matches</h1>
          <p className="font-body text-sm text-neutral-600">
            {matches.length === 0
              ? "Mutual interest with candidates shows up here for follow-up."
              : `${matches.length} candidate match${matches.length !== 1 ? "es" : ""} across your roles.`}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl bg-neutral-200/80 overflow-hidden border border-neutral-200/80">
        {[
          { label: "Total", value: overallStats.totalMatches },
          { label: "Shortlisted", value: overallStats.shortlisted },
          { label: "In conversation", value: overallStats.inConversation },
          { label: "Archived", value: overallStats.archived },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white px-4 py-4">
            <p className="font-heading text-xl font-semibold tabular-nums text-neutral-950 sm:text-2xl">{value}</p>
            <p className="font-body text-xs text-neutral-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {matches.length > 0 && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm">
          <h2 className="font-heading text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-4">
            Pipeline
          </h2>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            {[
              { label: "Matched", value: matches.length },
              { label: "Active", value: active.length },
              { label: "Shortlisted", value: shortlisted.length },
              { label: "In chat", value: overallStats.inConversation },
            ].map(({ label, value }) => (
              <div key={label} className="min-w-[4.5rem]">
                <p className="font-heading text-lg font-semibold tabular-nums text-neutral-950">{value}</p>
                <p className="font-body text-[11px] text-neutral-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex gap-1 p-1 rounded-xl border border-neutral-200 bg-neutral-50/80">
        {(
          [
            { key: "all" as const, label: `All (${active.length})` },
            { key: "starred" as const, label: `Shortlisted (${shortlisted.length})` },
            { key: "archived" as const, label: `Archived (${archived.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 py-2 rounded-lg font-body text-xs font-medium transition-colors",
              tab === t.key
                ? "bg-white text-neutral-950 shadow-sm ring-1 ring-neutral-200/80"
                : "text-neutral-600 hover:text-neutral-950"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {!displayed.length ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50/50 py-16 px-6 text-center">
            <p className="font-body text-sm text-neutral-600 max-w-md mx-auto">
              {tab === "all"
                ? "No matches yet. When you and a candidate both show interest, they appear here."
                : tab === "starred"
                  ? "Shortlist candidates from this list to prioritise them."
                  : "Nothing archived. Archive clears your main list without losing history."}
            </p>
            {tab === "all" && (
              <Link
                href="/discover"
                className="inline-flex mt-6 rounded-full bg-neutral-950 px-6 py-2.5 font-body text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Discover candidates
              </Link>
            )}
          </div>
        ) : (
          displayed.map((m) => <MatchCard key={m.id} match={m} />)
        )}
      </div>
    </div>
  )
}
