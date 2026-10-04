import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { one } from "@/lib/one"
import { EmptyState, Screen } from "@/components/ui"
import { colors } from "@/lib/theme"

type Convo = {
  id: string
  match_id: string
  matches?: {
    student_id?: string
    recruiter_id?: string
    jobs?: { title?: string | null } | { title?: string | null }[] | null
  } | {
    student_id?: string
    recruiter_id?: string
    jobs?: { title?: string | null } | { title?: string | null }[] | null
  }[] | null
}

type Row = {
  id: string
  title: string
  subtitle: string
  unread: number
  muted: boolean
  tick: string | null
}

export default function ChatInboxScreen() {
  const router = useRouter()
  const { session } = useSession()
  const userId = session!.user.id
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from("conversations")
      .select("id, match_id, matches(student_id, recruiter_id, jobs(title))")
      .order("created_at", { ascending: false })
    if (loadError) {
      setError(loadError.message)
      setRows([])
      setLoading(false)
      return
    }
    const mine = ((data ?? []) as Convo[]).flatMap((row) => {
      const match = one(row.matches)
      if (!match?.student_id || !match.recruiter_id) return []
      if (match.student_id !== userId && match.recruiter_id !== userId) return []
      const peerId = match.student_id === userId ? match.recruiter_id : match.student_id
      return [{ id: row.id, peerId, job: one(match.jobs)?.title || "Role" }]
    })
    const peerIds = [...new Set(mine.map((m) => m.peerId))]
    const names: Record<string, string> = {}
    if (peerIds.length) {
      const { data: people } = await supabase.from("profiles").select("id, full_name").in("id", peerIds)
      for (const p of people ?? []) names[p.id as string] = (p.full_name as string) || "Member"
    }
    const previews: Record<string, { text: string; mine: boolean; read: boolean }> = {}
    const unread: Record<string, number> = {}
    const muted = new Set<string>()
    if (mine.length) {
      const ids = mine.map((m) => m.id)
      const [{ data: msgs }, { data: mutes }] = await Promise.all([
        supabase
          .from("messages")
          .select("conversation_id, content, created_at, message_type, sender_id, is_read")
          .in("conversation_id", ids)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("conversation_mutes").select("conversation_id").eq("user_id", userId),
      ])
      for (const m of mutes ?? []) muted.add(m.conversation_id as string)
      for (const msg of msgs ?? []) {
        const cid = msg.conversation_id as string
        if (!previews[cid]) {
          const voice = (msg.message_type as string) === "voice"
          previews[cid] = {
            text: voice ? "Voice message" : (msg.content as string) || "",
            mine: msg.sender_id === userId,
            read: Boolean(msg.is_read),
          }
        }
        if (msg.sender_id !== userId && !msg.is_read) unread[cid] = (unread[cid] || 0) + 1
      }
    }
    setRows(
      mine.map((m) => {
        const preview = previews[m.id]
        const isMuted = muted.has(m.id)
        const count = isMuted ? 0 : unread[m.id] || 0
        let tick: string | null = null
        if (preview?.mine) tick = preview.read ? "Read" : "Sent"
        return {
          id: m.id,
          title: names[m.peerId] || "Match",
          subtitle: [isMuted ? "Muted" : null, m.job, preview?.text].filter(Boolean).join(" · "),
          unread: count,
          muted: isMuted,
          tick,
        }
      })
    )
    setError(null)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.head}>
          <Text style={styles.kicker}>Chat</Text>
          <Text style={styles.title}>Threads tied to a role</Text>
        </View>
        {loading ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: 32 }} />
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 32, gap: 10 }}
            refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} />}
            ListEmptyComponent={
              <EmptyState
                title={error ? "Couldn’t load chat" : "No threads yet"}
                body={error ?? "A conversation appears here only after a mutual match."}
              />
            }
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push(`/chat/${item.id}`)} style={styles.card}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  {item.unread ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.unread}</Text>
                    </View>
                  ) : item.tick ? (
                    <Text style={styles.tick}>{item.tick}</Text>
                  ) : null}
                </View>
                <Text style={styles.sub}>{item.subtitle}</Text>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 12 },
  kicker: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: colors.faint,
  },
  title: {
    marginTop: 8,
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.7,
    color: colors.ink,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
    color: colors.ink,
  },
  sub: {
    marginTop: 4,
    fontSize: 13,
    color: colors.muted,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: "700" },
  tick: { fontSize: 11, color: colors.navy, fontWeight: "600" },
})
