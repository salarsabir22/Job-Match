"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Notification } from "@/types"
import { formatTime } from "@/lib/utils"
import { resolveNotificationPath } from "@/lib/chat-navigation"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { PushOptIn } from "@/components/nav/PushOptIn"

export default function NotificationsPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Notification[]>([])
  const [streamUnreadCount, setStreamUnreadCount] = useState(0)

  const unreadCount = useMemo(() => items.filter((n) => !n.is_read).length, [items])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user) {
        setItems([])
        setLoading(false)
        return
      }

      const { data: notifications } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })

      try {
        const res = await fetch("/api/stream/unread")
        const stream = (await res.json().catch(() => ({}))) as { totalUnreadCount?: number }
        setStreamUnreadCount(Number(stream.totalUnreadCount ?? 0))
      } catch {
        setStreamUnreadCount(0)
      }

      setItems((notifications || []) as Notification[])
      setLoading(false)
    }
    load()
  }, [supabase])

  const actOnNotification = async (n: Notification) => {
    if (!n.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id)
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
    }

    router.push(await resolveNotificationPath(supabase, n))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl">Pings 🔔</h1>
          <p className="font-data text-[10px] tracking-widest uppercase text-neutral-700 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
          <p className="font-data text-[10px] tracking-widest uppercase text-neutral-600 mt-1">
            {streamUnreadCount > 0 ? `${streamUnreadCount} unread chat message${streamUnreadCount > 1 ? "s" : ""}` : "No unread chat messages"}
          </p>
          <div className="mt-3">
            <PushOptIn />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-white border border-black/10 p-6 text-center">
          <p className="font-body text-sm text-neutral-700">No pings yet. Go swipe. Make some noise. ✨</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-black/10 overflow-hidden">
          <div className="divide-y divide-white/8">
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => void actOnNotification(n)}
                className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-body text-sm text-black truncate">{n.title}</p>
                  {n.body && (
                    <p className="font-body text-xs text-neutral-800 mt-1 leading-relaxed line-clamp-2">
                      {n.body}
                    </p>
                  )}
                  <p className="font-data text-[10px] text-neutral-700 mt-2">
                    {formatTime(n.created_at)}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {!n.is_read ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <XCircle className="h-4 w-4 text-neutral-700" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

