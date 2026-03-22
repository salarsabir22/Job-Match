"use client"

import { startTransition, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatTime, cn } from "@/lib/utils"
import { resolveChatPath } from "@/lib/chat-navigation"
import type { Notification } from "@/types"

type NotificationBellProps = {
  /** Use `light` on white app chrome (headers); `dark` for dark backgrounds */
  variant?: "dark" | "light"
}

export function NotificationBell({ variant = "light" }: NotificationBellProps) {
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
    startTransition(() => {
      void loadItems()
    })
  }, [])

  useEffect(() => {
    if (!open) return
    startTransition(() => {
      void loadItems()
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
    const conversationId = (n.data as Record<string, unknown> | null)?.conversation_id as string | undefined
    const matchId = (n.data as Record<string, unknown> | null)?.match_id as string | undefined
    const jobId = (n.data as Record<string, unknown> | null)?.job_id as string | undefined

    if (!n.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id)
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
    }

    setOpen(false)

    const chatPath = await resolveChatPath(supabase, { conversationId, matchId })
    if (chatPath) {
      router.push(chatPath)
      return
    }

    if (jobId && n.type === "candidate_interested") {
      router.push("/discover")
      return
    }

    router.push("/notifications")
  }

  const isLight = variant === "light"

  return (
    <div ref={rootRef} className="relative z-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative h-8 w-8 rounded-lg border transition-all flex items-center justify-center",
          isLight
            ? "border-border text-muted-foreground hover:text-foreground hover:border-border bg-muted/50"
            : "border-white/[0.12] text-white/60 hover:text-white hover:border-white/25 bg-white/[0.04]"
        )}
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full font-data text-[9px] leading-4 text-center font-semibold",
              isLight ? "bg-black text-white" : "bg-white text-black"
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 mt-2 w-[320px] max-w-[85vw] rounded-xl border overflow-hidden shadow-lg",
            isLight
              ? "border-border bg-card shadow-none"
              : "border-white/[0.12] bg-zinc-950 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.85)]"
          )}
        >
          <div
            className={cn(
              "px-3 py-2 flex items-center justify-between border-b",
              isLight ? "border-border" : "border-white/[0.08]"
            )}
          >
            <p className={cn("font-body text-sm", isLight ? "text-foreground" : "text-white/90")}>Notifications</p>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                router.push("/notifications")
              }}
              className={cn(
                "font-data text-[10px] tracking-[0.15em] uppercase",
                isLight ? "text-neutral-500 hover:text-black" : "text-white/40 hover:text-white/70"
              )}
            >
              View all
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <p className={cn("px-3 py-4 font-body text-xs", isLight ? "text-muted-foreground" : "text-white/45")}>
                Loading…
              </p>
            ) : items.length === 0 ? (
              <p className={cn("px-3 py-4 font-body text-xs", isLight ? "text-muted-foreground" : "text-white/45")}>
                No notifications yet.
              </p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => void openNotification(n)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 last:border-b-0 transition-colors border-b",
                    isLight
                      ? "border-black/[0.06] hover:bg-black/[0.04]"
                      : "border-white/[0.06] hover:bg-white/[0.05]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className={cn("font-body text-xs truncate", isLight ? "text-foreground" : "text-white/90")}
                      >
                        {n.title}
                      </p>
                      {n.body && (
                        <p
                          className={cn(
                            "font-body text-[11px] mt-0.5 line-clamp-2",
                            isLight ? "text-neutral-600" : "text-white/50"
                          )}
                        >
                          {n.body}
                        </p>
                      )}
                      <p
                        className={cn("font-data text-[9px] mt-1", isLight ? "text-muted-foreground" : "text-white/35")}
                      >
                        {formatTime(n.created_at)}
                      </p>
                    </div>
                    <span
                      className={
                        !n.is_read
                          ? cn(
                              "mt-1 size-1.5 shrink-0 rounded-full",
                              isLight ? "bg-black" : "bg-white/90"
                            )
                          : cn(
                              "mt-1 size-1.5 shrink-0 rounded-full",
                              isLight ? "bg-border" : "bg-white/[0.12]"
                            )
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
