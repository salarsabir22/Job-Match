import { useEffect, useRef } from "react"
import { useRouter } from "expo-router"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { enablePush, getNotifications, getPushEnabled, hrefFromPingData, presentPing } from "@/lib/push"

export function PushBridge() {
  const router = useRouter()
  const { session } = useSession()
  const userId = session?.user.id
  const handled = useRef<string | null>(null)

  useEffect(() => {
    if (!userId) return

    void (async () => {
      if (await getPushEnabled()) await enablePush()
    })()

    const channel = supabase
      .channel(`mobile-pings:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as {
            title?: string
            body?: string
            message?: string
            type?: string
            data?: Record<string, unknown> | null
          }
          void presentPing({
            title: row.title || "swypejobs",
            body: row.body || row.message || "",
            data: { ...(row.data || {}), type: row.type },
          })
        }
      )
      .subscribe()

    const Notifications = getNotifications()
    const last = Notifications?.getLastNotificationResponse()
    const lastId = last?.notification.request.identifier
    if (last && lastId && handled.current !== lastId) {
      handled.current = lastId
      const data = last.notification.request.content.data as Record<string, unknown>
      const type = typeof data?.type === "string" ? data.type : undefined
      const href = hrefFromPingData(data, type)
      if (href !== "/notifications") router.push(href as never)
    }

    const response = Notifications?.addNotificationResponseReceivedListener((event) => {
      const id = event.notification.request.identifier
      if (handled.current === id) return
      handled.current = id
      const data = event.notification.request.content.data as Record<string, unknown>
      const type = typeof data?.type === "string" ? data.type : undefined
      router.push(hrefFromPingData(data, type) as never)
    })

    return () => {
      response?.remove()
      void supabase.removeChannel(channel)
    }
  }, [router, userId])

  return null
}
