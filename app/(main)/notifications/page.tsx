"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Notification } from "@/types"
import { formatTime } from "@/lib/utils"
import { Bell, Loader2, CheckCircle, XCircle } from "lucide-react"

export default function NotificationsPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Notification[]>([])

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

      setItems((notifications || []) as Notification[])
      setLoading(false)
    }
    load()
  }, [supabase])

  const actOnNotification = async (n: Notification) => {
    // If the notification has a conversation_id, we can route directly to the chat.
    const conversationId = (n.data as any)?.conversation_id as string | undefined
    const matchId = (n.data as any)?.match_id as string | undefined

    // Mark as read first so UI updates immediately.
    if (!n.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id)
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
    }

    // Your chat route is /chat/[matchId], so prefer match_id.
    if (matchId) {
      router.push(`/chat/${matchId}`)
      return
    }

    // Fallback: if only conversation_id exists, find the match_id via conversations table.
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

    // Last fallback: go to matches list.
    router.push("/matches")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#F7931A]" />
            Notifications
          </h1>
          <p className="font-data text-[11px] tracking-widest uppercase text-[#94A3B8] mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[#F7931A]" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-[#0F1115] border border-white/8 p-6 text-center">
          <p className="font-body text-sm text-[#94A3B8]">No notifications yet.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#0F1115] border border-white/8 overflow-hidden">
          <div className="divide-y divide-white/8">
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => void actOnNotification(n)}
                className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-body text-sm text-white truncate">{n.title}</p>
                  {n.body && (
                    <p className="font-body text-xs text-[#CBD5E1] mt-1 leading-relaxed line-clamp-2">
                      {n.body}
                    </p>
                  )}
                  <p className="font-data text-[10px] text-[#94A3B8] mt-2">
                    {formatTime(n.created_at)}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {!n.is_read ? (
                    <CheckCircle className="h-4 w-4 text-[#F7931A]" />
                  ) : (
                    <XCircle className="h-4 w-4 text-[#94A3B8]" />
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

