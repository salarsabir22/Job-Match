"use client"

import { startTransition, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatTime, cn } from "@/lib/utils"
import { resolveNotificationPath } from "@/lib/chat-navigation"
import type { Notification } from "@/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ListRowSkeleton } from "@/components/skeletons"

export function NotificationBell() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [chatUnreadCount, setChatUnreadCount] = useState(0)
  const [coords, setCoords] = useState({ top: 0, right: 12 })
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  const unreadCount = items.filter((n) => !n.is_read).length + chatUnreadCount

  const placePanel = () => {
    const el = buttonRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setCoords({
      top: Math.min(rect.bottom + 8, window.innerHeight - 16),
      right: Math.max(12, window.innerWidth - rect.right),
    })
  }

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
    placePanel()
    startTransition(() => {
      void loadItems()
      void loadChatUnread()
    })
    const onWin = () => placePanel()
    window.addEventListener("resize", onWin)
    window.addEventListener("scroll", onWin, true)
    return () => {
      window.removeEventListener("resize", onWin)
      window.removeEventListener("scroll", onWin, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDocClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const openNotification = async (n: Notification) => {
    if (!n.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id)
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
    }

    setOpen(false)
    router.push(await resolveNotificationPath(supabase, n))
  }

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        className="relative h-9 w-9 rounded-full text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
        title="Notifications"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
        {unreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" aria-hidden />
        ) : null}
      </Button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <Card
              ref={panelRef}
              role="dialog"
              aria-label="Notifications"
              className="fixed z-[80] flex w-[min(22.5rem,calc(100vw-1.5rem))] flex-col overflow-hidden shadow-lg"
              style={{ top: coords.top, right: coords.right }}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
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

              <div className="max-h-[min(24rem,calc(100vh-6.5rem))] overflow-y-auto overscroll-contain">
                {loading ? (
                  <ListRowSkeleton count={4} className="px-3 py-2" />
                ) : items.length === 0 ? (
                  <p className="px-3 py-4 font-body text-xs text-muted-foreground">No notifications yet.</p>
                ) : (
                  items.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => void openNotification(n)}
                      className="flex w-full items-start gap-2.5 border-b border-border px-3 py-2.5 text-left last:border-b-0 hover:bg-muted/60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-body text-xs font-medium leading-snug text-foreground">{n.title}</p>
                        {n.body ? (
                          <p className="mt-0.5 line-clamp-3 font-body text-[11px] leading-relaxed text-muted-foreground">
                            {n.body}
                          </p>
                        ) : null}
                        <p className="mt-1 font-data text-[9px] text-muted-foreground">{formatTime(n.created_at)}</p>
                      </div>
                      <span
                        className={cn(
                          "mt-1 size-1.5 shrink-0 rounded-full",
                          n.is_read ? "bg-border" : "bg-primary"
                        )}
                        aria-hidden
                      />
                    </button>
                  ))
                )}
              </div>
            </Card>,
            document.body
          )
        : null}
    </div>
  )
}
