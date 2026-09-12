"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Archive, Columns3, LayoutList } from "lucide-react"
import { getInitials, formatDate, cn } from "@/lib/utils"
import { useToast } from "@/lib/hooks/use-toast"
import { PIPELINE_LABEL, PIPELINE_STATUSES, type PipelineStatus } from "@/lib/match/fit"
import { AppleActivityIndicator } from "@/components/ui/apple-activity-indicator"

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
  pipeline_status?: string | null
  recruiter_notes?: string | null
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
  const [layout, setLayout] = useState<"board" | "list">("board")
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

  const updatePipeline = async (matchId: string, status: PipelineStatus) => {
    const supabase = createClient()
    const { error } = await supabase.from("matches").update({ pipeline_status: status }).eq("id", matchId)
    if (error) {
      toast({ variant: "destructive", title: "Couldn’t update status", description: error.message })
      return
    }
    setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, pipeline_status: status } : m)))
  }

  const saveNotes = async (matchId: string, notes: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("matches").update({ recruiter_notes: notes }).eq("id", matchId)
    if (error) {
      toast({ variant: "destructive", title: "Couldn’t save notes", description: error.message })
      return
    }
    setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, recruiter_notes: notes } : m)))
  }

  const active = matches.filter((m) => !m.is_archived)
  const shortlisted = matches.filter((m) => m.is_shortlisted && !m.is_archived)
  const archived = matches.filter((m) => m.is_archived)
  const displayed = tab === "all" ? active : tab === "starred" ? shortlisted : archived

  const MatchCard = ({ match, compact }: { match: MatchRow; compact?: boolean }) => {
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
        <CardContent className={cn("flex items-start", compact ? "gap-3 p-3" : "gap-4 p-4 sm:p-5")}>
          <Avatar className={cn("shrink-0 ring-1 ring-border", compact ? "h-10 w-10" : "h-12 w-12")}>
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
              {compact ? null : (
                <time className="font-body text-[11px] text-muted-foreground shrink-0 tabular-nums">
                  {formatDate(match.created_at)}
                </time>
              )}
            </div>

            {skills.length > 0 && !compact && (
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

            <div className={cn("space-y-2", compact ? "mt-2" : "mt-3")}>
              <Select
                value={(match.pipeline_status as PipelineStatus) || "chatting"}
                onValueChange={(value) => void updatePipeline(match.id, value as PipelineStatus)}
              >
                <SelectTrigger className={cn("w-full rounded-full", compact ? "h-8 text-xs" : "h-9 sm:w-[180px]")} aria-label="Pipeline status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {PIPELINE_LABEL[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {compact ? null : (
                <MatchNotes
                  matchId={match.id}
                  initial={match.recruiter_notes || ""}
                  onSave={saveNotes}
                />
              )}
            </div>
          </div>
        </CardContent>

        {compact ? (
          <CardContent className="border-t border-border px-3 py-2.5">
            <Button asChild size="sm" className="h-8 w-full">
              <Link href={`/chat/${convId || match.id}`}>Open chat</Link>
            </Button>
          </CardContent>
        ) : (
        <CardContent className="flex flex-col gap-3 border-t border-border px-4 pb-4 pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex flex-wrap gap-2">
            {match.is_shortlisted && (
              <Badge>Shortlisted for {match.jobs?.title || "this role"}</Badge>
            )}
            {convId && <Badge variant="outline">In chat</Badge>}
            {match.pipeline_status && match.pipeline_status !== "chatting" ? (
              <Badge variant="secondary">{PIPELINE_LABEL[match.pipeline_status as PipelineStatus] || match.pipeline_status}</Badge>
            ) : null}
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
        )}
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <AppleActivityIndicator size={36} />
        <p className="font-body text-[13px] font-medium tracking-[-0.01em] text-muted-foreground">Loading matches…</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 min-w-0 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1 min-w-0">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">Pipeline</h1>
          <p className="font-body text-sm text-muted-foreground">
            {matches.length === 0
              ? "When you shortlist someone, they land here with the job attached."
              : `${matches.length} candidate${matches.length !== 1 ? "s" : ""} across your roles.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={layout === "board" ? "secondary" : "outline"}
            className="rounded-full"
            onClick={() => setLayout("board")}
          >
            <Columns3 className="h-4 w-4" />
            Board
          </Button>
          <Button
            type="button"
            size="sm"
            variant={layout === "list" ? "secondary" : "outline"}
            className="rounded-full"
            onClick={() => setLayout("list")}
          >
            <LayoutList className="h-4 w-4" />
            List
          </Button>
          {overallStats.inConversation > 0 ? (
            <Button asChild>
              <Link href="/chat">Open inbox</Link>
            </Button>
          ) : null}
        </div>
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
              { label: "Interview", value: matches.filter((m) => m.pipeline_status === "interview").length },
              { label: "Offer", value: matches.filter((m) => m.pipeline_status === "offer").length },
              { label: "Hired", value: matches.filter((m) => m.pipeline_status === "hired").length },
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
        ) : layout === "board" && tab !== "archived" ? (
          <div className="-mx-4 overflow-x-auto px-4 pb-2">
            <div className="flex min-w-[52rem] gap-3 lg:min-w-0 lg:grid lg:grid-cols-4">
              {(["chatting", "interview", "offer", "hired"] as PipelineStatus[]).map((status) => {
                const column = displayed.filter((m) => (m.pipeline_status || "chatting") === status)
                return (
                  <div key={status} className="w-[16rem] shrink-0 space-y-3 lg:w-auto">
                    <div className="flex items-center justify-between px-1">
                      <p className="font-data text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {PIPELINE_LABEL[status]}
                      </p>
                      <span className="font-body text-xs tabular-nums text-muted-foreground">{column.length}</span>
                    </div>
                    {column.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border px-3 py-8 text-center font-body text-xs text-muted-foreground">
                        Empty
                      </div>
                    ) : (
                      column.map((m) => <MatchCard key={m.id} match={m} compact />)
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          displayed.map((m) => <MatchCard key={m.id} match={m} />)
        )}
      </div>
    </div>
  )
}

function MatchNotes({
  matchId,
  initial,
  onSave,
}: {
  matchId: string
  initial: string
  onSave: (matchId: string, notes: string) => Promise<void>
}) {
  const [value, setValue] = useState(initial)
  return (
    <Textarea
      rows={2}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== initial) void onSave(matchId, value)
      }}
      placeholder="Private notes (only you see these)"
      className="min-h-[4.5rem] resize-none text-sm"
    />
  )
}
