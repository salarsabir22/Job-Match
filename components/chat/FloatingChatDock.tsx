"use client"

import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatWindow } from "@/components/chat/ChatWindow"
import { cn, getInitials } from "@/lib/utils"
import type { Profile } from "@/types"
import { ArrowLeft, ChevronLeft, MessageCircle, Minus, Search, X } from "lucide-react"

type MatchRow = {
  id: string
  jobs?: { title?: string | null } | { title?: string | null }[] | null
  conversations?: { id: string } | { id: string }[] | null
  student?: { id: string; full_name?: string | null; avatar_url?: string | null } | null
  recruiter?: { id: string; full_name?: string | null; avatar_url?: string | null } | null
}

function jobTitle(m: MatchRow): string | null {
  const j = m.jobs as unknown
  if (Array.isArray(j)) return j[0]?.title ?? null
  if (j && typeof j === "object" && "title" in j) return (j as { title?: string | null }).title ?? null
  return null
}

function otherUserFromMatch(m: MatchRow, userId: string) {
  const isStudent = m.student?.id === userId
  return isStudent ? m.recruiter : m.student
}

function convIdFromMatch(m: MatchRow): string | null {
  const c = m.conversations
  if (Array.isArray(c)) return c[0]?.id ?? null
  if (c && typeof c === "object" && "id" in c) return c.id
  return null
}

export function FloatingChatDock() {
  const supabase = useMemo(() => createClient(), [])
  const [userId, setUserId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [list, setList] = useState<MatchRow[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [search, setSearch] = useState("")
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [thread, setThread] = useState<{
    conversationId: string
    other: Profile
    jobTitle: string | null
  } | null>(null)

  useEffect(() => {
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
    })
  }, [supabase])

  const loadMatches = useCallback(async () => {
    if (!userId) return
    setLoadingList(true)
    const { data, error } = await supabase
      .from("matches")
      .select(
        `
        id,
        jobs(title),
        conversations(id),
        student:profiles!matches_student_id_fkey(id, full_name, avatar_url),
        recruiter:profiles!matches_recruiter_id_fkey(id, full_name, avatar_url)
      `
      )
      .or(`student_id.eq.${userId},recruiter_id.eq.${userId}`)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setList((data || []) as unknown as MatchRow[])
      const ids = (data || [])
        .map((row) => convIdFromMatch(row as unknown as MatchRow))
        .filter((x): x is string => !!x)
      if (ids.length) {
        const { data: unreadRows } = await supabase
          .from("messages")
          .select("conversation_id")
          .in("conversation_id", ids)
          .eq("is_read", false)
          .neq("sender_id", userId)
        const by = new Map<string, number>()
        for (const r of unreadRows || []) {
          const id = (r as { conversation_id: string }).conversation_id
          by.set(id, (by.get(id) || 0) + 1)
        }
        setUnreadTotal([...by.values()].reduce((a, b) => a + b, 0))
      } else {
        setUnreadTotal(0)
      }
    }
    setLoadingList(false)
  }, [supabase, userId])

  useEffect(() => {
    if (!userId) return
    void loadMatches()
  }, [userId, loadMatches])

  useEffect(() => {
    if (!open) return
    void loadMatches()
  }, [open, loadMatches])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q || !userId) return list
    return list.filter((m) => {
      const other = otherUserFromMatch(m, userId)
      const name = other?.full_name?.toLowerCase() || ""
      const job = (jobTitle(m) || "").toLowerCase()
      return name.includes(q) || job.includes(q)
    })
  }, [list, search, userId])

  const openThread = (m: MatchRow) => {
    const cid = convIdFromMatch(m)
    if (!cid || !userId) return
    const isStudent = m.student?.id === userId
    const otherRaw = otherUserFromMatch(m, userId)
    const other: Profile = {
      id: otherRaw?.id ?? "unknown",
      role: isStudent ? "recruiter" : "student",
      full_name: otherRaw?.full_name ?? "Unknown",
      avatar_url: otherRaw?.avatar_url ?? null,
      bio: null,
      profile_video_url: null,
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
    }
    setThread({ conversationId: cid, other, jobTitle: jobTitle(m) })
  }

  if (!userId) return null

  return (
    <>
      <div className="fixed bottom-4 left-4 z-[100] flex flex-col items-start gap-2 pointer-events-none [&>*]:pointer-events-auto">
        <AnimatePresence>
          {open && !minimized && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="w-[min(100vw-2rem,380px)] h-[min(560px,calc(100vh-5rem))] flex flex-col rounded-2xl border border-primary/15 bg-card shadow-2xl shadow-primary/15 overflow-hidden"
            >
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-primary text-primary-foreground shrink-0">
                {thread ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/15"
                      onClick={() => setThread(null)}
                      aria-label="Back to chats"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Avatar className="h-8 w-8 border border-primary-foreground/20">
                      <AvatarImage src={thread.other.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary-foreground/15 text-xs font-semibold text-primary-foreground">
                        {getInitials(thread.other.full_name || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-heading text-sm font-semibold truncate leading-tight">{thread.other.full_name}</p>
                      {thread.jobTitle && (
                        <p className="font-data text-[10px] opacity-90 truncate">{thread.jobTitle}</p>
                      )}
                    </div>
                    <Link
                      href={`/chat/${thread.conversationId}`}
                      className="font-data text-[10px] uppercase tracking-wide opacity-90 hover:underline shrink-0"
                    >
                      Open
                    </Link>
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-5 w-5 shrink-0 opacity-90" />
                    <p className="font-heading text-sm font-semibold flex-1">Chats</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/15"
                      onClick={() => setMinimized(true)}
                      aria-label="Minimize"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/15"
                      onClick={() => {
                        setOpen(false)
                        setThread(null)
                      }}
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              {thread ? (
                <div className="flex-1 min-h-0 flex flex-col bg-background">
                  <ChatWindow
                    conversationId={thread.conversationId}
                    currentUserId={userId}
                    otherUser={thread.other}
                    variant="dock"
                  />
                </div>
              ) : (
                <div className="flex flex-col flex-1 min-h-0 bg-background">
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search chats…"
                        className="w-full h-9 pl-8 pr-3 rounded-xl border border-border bg-muted/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                      />
                    </div>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                      {loadingList ? (
                        <p className="text-center text-sm text-muted-foreground py-8">Loading…</p>
                      ) : filtered.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">No conversations yet.</p>
                      ) : (
                        filtered.map((m) => {
                          const cid = convIdFromMatch(m)
                          if (!cid) return null
                          const other = otherUserFromMatch(m, userId)
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => openThread(m)}
                              className="w-full flex items-center gap-3 rounded-xl p-2.5 text-left hover:bg-muted/80 transition-colors"
                            >
                              <Avatar className="h-10 w-10 border border-border shrink-0">
                                <AvatarImage src={other?.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                  {getInitials(other?.full_name || "?")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="font-heading text-sm font-semibold text-foreground truncate">
                                  {other?.full_name}
                                </p>
                                <p className="font-body text-xs text-muted-foreground truncate">
                                  {jobTitle(m) || "Match"}
                                </p>
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>
                  </ScrollArea>
                  <div className="p-2 border-t border-border">
                    <Link
                      href="/matches"
                      className="flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium text-primary hover:bg-primary/10 hover:underline underline-offset-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      All matches
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="lg"
            className={cn(
              "relative h-14 w-14 rounded-full shadow-lg border border-primary/25 bg-primary text-primary-foreground hover:bg-[var(--clearpath-navy-hover)]",
              open && !minimized && "ring-2 ring-primary/40"
            )}
            onClick={() => {
              if (minimized) {
                setMinimized(false)
                return
              }
              setOpen((o) => !o)
            }}
            aria-label={open ? "Close chats" : "Open chats"}
          >
            <MessageCircle className="h-6 w-6" />
            {unreadTotal > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background">
                {unreadTotal > 99 ? "99+" : unreadTotal}
              </span>
            )}
          </Button>
        </div>
      </div>
    </>
  )
}
