"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
      <Card>
        <CardContent className="flex items-start gap-4 p-4 sm:p-5">
          <Avatar className="h-12 w-12 shrink-0 ring-1 ring-border">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {getInitials(profile?.full_name || "?")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-heading font-semibold text-sm text-foreground truncate">{profile?.full_name}</p>
                <p className="font-body text-xs text-muted-foreground truncate mt-0.5">
                  {match.jobs?.title ? `For ${match.jobs.title}` : "Role"}
                </p>
                {schoolLine && (
                  <p className="font-body text-[11px] text-muted-foreground mt-1 truncate">{schoolLine}</p>
                )}
              </div>
              <time className="font-body text-[11px] text-muted-foreground shrink-0 tabular-nums">
                {formatDate(match.created_at)}
              </time>
            </div>

            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {skills.map((s: string) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
                {(sp?.skills?.length || 0) > 3 && (
                  <Badge variant="outline">+{(sp?.skills?.length || 0) - 3}</Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>

        <CardContent className="flex flex-col gap-3 border-t border-border px-4 pb-4 pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex flex-wrap gap-2">
            {match.is_shortlisted && (
              <Badge>Shortlisted for {match.jobs?.title || "this role"}</Badge>
            )}
            {convId && <Badge variant="outline">In chat</Badge>}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              size="icon"
              variant={match.is_shortlisted ? "secondary" : "outline"}
              onClick={() => toggleShortlist(match.id, !!match.is_shortlisted)}
              aria-label={match.is_shortlisted ? "Remove from shortlist" : "Add to shortlist"}
            >
              <Star className={cn("h-4 w-4", match.is_shortlisted && "fill-primary text-primary")} strokeWidth={1.5} />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => toggleArchive(match.id, !!match.is_archived)}
              aria-label={match.is_archived ? "Unarchive" : "Archive"}
            >
              <Archive className="h-4 w-4" strokeWidth={1.5} />
            </Button>
            {profile?.id ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/candidates/${profile.id}`}>Profile</Link>
              </Button>
            ) : null}
            <Button asChild size="sm">
              <Link href={`/chat/${convId || match.id}`}>Open chat</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div
          className="h-9 w-9 rounded-full border-2 border-border border-t-primary animate-spin"
          aria-hidden
        />
        <p className="font-body text-sm text-muted-foreground">Loading matches…</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 min-w-0 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1 min-w-0">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">Matches</h1>
          <p className="font-body text-sm text-muted-foreground">
            {matches.length === 0
              ? "When you shortlist someone, they land here with the job attached."
              : `${matches.length} candidate${matches.length !== 1 ? "s" : ""} across your roles.`}
          </p>
        </div>
        {overallStats.inConversation > 0 ? (
          <Button asChild>
            <Link href="/chat">Open inbox</Link>
          </Button>
        ) : null}
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total", value: overallStats.totalMatches },
          { label: "Shortlisted", value: overallStats.shortlisted },
          { label: "In conversation", value: overallStats.inConversation },
          { label: "Archived", value: overallStats.archived },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="p-4 pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-x-6 gap-y-4">
            {[
              { label: "Matched", value: matches.length },
              { label: "Active", value: active.length },
              { label: "Shortlisted", value: shortlisted.length },
              { label: "In chat", value: overallStats.inConversation },
            ].map(({ label, value }) => (
              <div key={label} className="min-w-[4.5rem]">
                <p className="font-heading text-lg font-semibold tabular-nums text-foreground">{value}</p>
                <p className="font-body text-[11px] text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
        <TabsList className="grid h-auto w-full grid-cols-3">
          <TabsTrigger value="all" className="py-2">All ({active.length})</TabsTrigger>
          <TabsTrigger value="starred" className="py-2">Shortlisted ({shortlisted.length})</TabsTrigger>
          <TabsTrigger value="archived" className="py-2">Archived ({archived.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {!displayed.length ? (
          <Card className="px-6 py-16 text-center">
            <CardContent className="pt-6">
              <p className="mx-auto max-w-md font-body text-sm text-muted-foreground">
                {tab === "all"
                  ? "No matches yet. When you and a candidate both show interest, they appear here."
                  : tab === "starred"
                    ? "Shortlist candidates from this list to prioritise them."
                    : "Nothing archived. Archive clears your main list without losing history."}
              </p>
              {tab === "all" && (
                <Button asChild className="mt-6">
                  <Link href="/discover">Discover candidates</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          displayed.map((m) => <MatchCard key={m.id} match={m} />)
        )}
      </div>
    </div>
  )
}
