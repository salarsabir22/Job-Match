"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatTime } from "@/lib/utils"
import type { Notification } from "@/types"

export function NotificationBell() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const rootRef = useRef<HTMLDivElement | null>(null)

  const unreadCount = items.filter((n) => !n.is_read).length

  const loadItems = async () => {
    setLoading(true)
    const { data: userRes } = await supabase.auth.getUser()
    if (!userRes.user) {
      setItems([])
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8)

    setItems((data || []) as Notification[])
    setLoading(false)
  }

  useEffect(() => {
    void loadItems()
  }, [])

  useEffect(() => {
    if (!open) return
    void loadItems()
  }, [open])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  const openNotification = async (n: Notification) => {
    const conversationId = (n.data as Record<string, unknown> | null)?.conversation_id as string | undefined
    const matchId = (n.data as Record<string, unknown> | null)?.match_id as string | undefined
    const jobId = (n.data as Record<string, unknown> | null)?.job_id as string | undefined

    if (!n.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id)
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
    }

    setOpen(false)

    if (matchId) {
      router.push(`/chat/${matchId}`)
      return
    }

    if (conversationId) {
      const { data } = await supabase
        .from("conversations")
        .select("match_id")
        .eq("id", conversationId)
        .single()

      if (data?.match_id) {
        router.push(`/chat/${data.match_id}`)
        return
      }
    }

    if (jobId && n.type === "candidate_interested") {
      router.push("/discover")
      return
    }

    router.push("/notifications")
  }

  return (
    <div ref={rootRef} className="relative z-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative h-8 w-8 rounded-lg border border-white/[0.12] text-white/60 hover:text-white hover:border-white/25 transition-all flex items-center justify-center bg-white/[0.04]"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-white text-black font-data text-[9px] leading-4 text-center font-semibold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[320px] max-w-[85vw] rounded-xl border border-white/[0.12] bg-zinc-950 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.85)] overflow-hidden">
          <div className="px-3 py-2 border-b border-white/[0.08] flex items-center justify-between">
            <p className="font-body text-sm text-white/90">Notifications</p>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                router.push("/notifications")
              }}
              className="font-data text-[10px] tracking-[0.15em] uppercase text-white/40 hover:text-white/70"
            >
              View all
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <p className="px-3 py-4 font-body text-xs text-white/45">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-4 font-body text-xs text-white/45">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => void openNotification(n)}
                  className="w-full text-left px-3 py-2.5 border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-body text-xs text-white/90 truncate">{n.title}</p>
                      {n.body && (
                        <p className="font-body text-[11px] text-white/50 mt-0.5 line-clamp-2">{n.body}</p>
                      )}
                      <p className="font-data text-[9px] text-white/35 mt-1">{formatTime(n.created_at)}</p>
                    </div>
                    <span
                      className={
                        !n.is_read
                          ? "mt-1 size-1.5 shrink-0 rounded-full bg-white/90"
                          : "mt-1 size-1.5 shrink-0 rounded-full bg-white/[0.12]"
                      }
                      aria-hidden
                    />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
