import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { supabase } from "@/lib/supabase"
import { CardBox, EmptyState, GhostButton } from "@/components/ui"
import { PushOptIn } from "@/components/PushOptIn"
import { colors } from "@/lib/theme"

type Note = {
  id: string
  type: string
  title?: string | null
  body?: string | null
  message?: string | null
  is_read: boolean
  created_at: string
  data?: Record<string, unknown> | null
}

export default function NotificationsScreen() {
  const router = useRouter()
  const [items, setItems] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(80)
    setItems((data ?? []) as Note[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
    const channel = supabase
      .channel("mobile-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        setItems((prev) => [payload.new as Note, ...prev.filter((n) => n.id !== (payload.new as Note).id)])
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [load])

  const open = async (n: Note) => {
    if (!n.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id)
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
    }
    const payload = n.data || {}
    const conversationId = typeof payload.conversation_id === "string" ? payload.conversation_id : null
    const jobId = typeof payload.job_id === "string" ? payload.job_id : null
    const studentId = typeof payload.student_id === "string" ? payload.student_id : null
    if (conversationId) router.push(`/chat/${conversationId}`)
    else if (studentId) router.push(`/candidate/${studentId}`)
    else if (jobId) router.push(`/job/${jobId}`)
    else if (n.type === "new_jobs_digest") router.push("/discover")
    else router.push("/dashboard")
  }

  const markAll = async () => {
    const unread = items.filter((n) => !n.is_read).map((n) => n.id)
    if (!unread.length) return
    await supabase.from("notifications").update({ is_read: true }).in("id", unread)
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  if (loading) return <ActivityIndicator color={colors.navy} style={{ marginTop: 40 }} />

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} />}
      ListHeaderComponent={
        <View style={{ marginBottom: 8, gap: 10 }}>
          <PushOptIn />
          {items.some((n) => !n.is_read) ? <GhostButton label="Mark all read" onPress={() => void markAll()} /> : null}
        </View>
      }
      ListEmptyComponent={<EmptyState title="You're caught up" body="Pings for matches, applications, and chat land here." />}
      renderItem={({ item }) => (
        <CardBox onPress={() => void open(item)}>
          <Text style={[styles.type, !item.is_read && { color: colors.navy }]}>{item.type.replace(/_/g, " ")}</Text>
          <Text style={styles.title}>{item.title || item.message || item.body || "Notification"}</Text>
          {item.body && item.title ? <Text style={styles.body}>{item.body}</Text> : null}
        </CardBox>
      )}
    />
  )
}

const styles = StyleSheet.create({
  type: { fontSize: 11, fontWeight: "600", color: colors.faint, textTransform: "capitalize" },
  title: { marginTop: 4, fontSize: 15, fontWeight: "600", color: colors.ink },
  body: { marginTop: 4, fontSize: 13, color: colors.muted },
})
