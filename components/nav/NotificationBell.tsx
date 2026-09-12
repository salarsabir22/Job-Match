"use client"

import { startTransition, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatTime, cn } from "@/lib/utils"
import { resolveNotificationPath } from "@/lib/chat-navigation"
import type { Notification } from "@/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

export function NotificationBell() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [chatUnreadCount, setChatUnreadCount] = useState(0)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const unreadCount = items.filter((n) => !n.is_read).length + chatUnreadCount

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

  const loadChatUnread = async () => {
    try {
      const res = await fetch("/api/chat/unread", { method: "GET" })
      const data = (await res.json().catch(() => ({}))) as { totalUnreadCount?: number }
      setChatUnreadCount(Number(data.totalUnreadCount ?? 0))
    } catch {
      setChatUnreadCount(0)
    }
  }

  useEffect(() => {
    startTransition(() => {
      void loadItems()
      void loadChatUnread()
    })
  }, [])

  useEffect(() => {
    if (!open) return
    startTransition(() => {
      void loadItems()
      void loadChatUnread()
    })
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
    if (!n.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id)
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
    }

    setOpen(false)
    router.push(await resolveNotificationPath(supabase, n))
  }

  return (
    <div ref={rootRef} className="relative z-50">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        className="relative h-9 w-9 rounded-full text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
        title="Notifications"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
        {unreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" aria-hidden />
        ) : null}
      </Button>

      {open && (
        <Card className="absolute right-0 mt-2 w-[320px] max-w-[85vw] overflow-hidden shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="font-body text-sm text-foreground">Notifications</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false)
                router.push("/notifications")
              }}
              className="h-7 px-2 font-data text-[10px] uppercase tracking-[0.15em] text-muted-foreground"
            >
              View all
            </Button>
          </div>

          <ScrollArea className="max-h-[360px]">
            {loading ? (
              <p className="px-3 py-4 font-body text-xs text-muted-foreground">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-4 font-body text-xs text-muted-foreground">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <Button
                  key={n.id}
                  type="button"
                  variant="ghost"
                  onClick={() => void openNotification(n)}
                  className="h-auto w-full rounded-none border-b border-border px-3 py-2.5 text-left last:border-b-0"
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-body text-xs text-foreground">{n.title}</p>
                      {n.body && (
                        <p className="mt-0.5 line-clamp-2 font-body text-[11px] text-muted-foreground">{n.body}</p>
                      )}
                      <p className="mt-1 font-data text-[9px] text-muted-foreground">{formatTime(n.created_at)}</p>
                    </div>
                    <span
                      className={cn(
                        "mt-1 size-1.5 shrink-0 rounded-full",
                        n.is_read ? "bg-border" : "bg-primary"
                      )}
                      aria-hidden
                    />
                  </div>
                </Button>
              ))
            )}
          </ScrollArea>
        </Card>
      )}
    </div>
  )
}
