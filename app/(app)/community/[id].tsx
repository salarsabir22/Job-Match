import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { useLocalSearchParams } from "expo-router"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { one } from "@/lib/one"
import { EmptyState, GhostButton, PrimaryButton } from "@/components/ui"
import { colors } from "@/lib/theme"

type Msg = {
  id: string
  content: string
  sender_id: string
  created_at: string
  profiles?: { full_name?: string | null } | { full_name?: string | null }[] | null
}

export default function ChannelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useSession()
  const userId = session!.user.id
  const [name, setName] = useState("")
  const [member, setMember] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    const [{ data: channel }, { data: membership }] = await Promise.all([
      supabase.from("community_channels").select("name").eq("id", id).maybeSingle(),
      supabase.from("channel_members").select("user_id").eq("channel_id", id).eq("user_id", userId).maybeSingle(),
    ])
    setName(channel?.name || "Channel")
    const isMember = Boolean(membership)
    setMember(isMember)
    if (isMember) {
      const { data } = await supabase
        .from("channel_messages")
        .select("id, content, sender_id, created_at, profiles(full_name)")
        .eq("channel_id", id)
        .order("created_at", { ascending: true })
        .limit(100)
      setMessages((data ?? []) as Msg[])
    }
    setLoading(false)
  }, [id, userId])

  useEffect(() => {
    void load()
    const channel = supabase
      .channel(`mobile-channel:${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "channel_messages", filter: `channel_id=eq.${id}` },
        (payload) => {
          const row = payload.new as Msg
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]))
        }
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [id, load])

  const join = async () => {
    await supabase.from("channel_members").insert({ channel_id: id, user_id: userId })
    await load()
  }

  const leave = async () => {
    await supabase.from("channel_members").delete().eq("channel_id", id).eq("user_id", userId)
    setMember(false)
    setMessages([])
  }

  const send = async () => {
    const content = draft.trim()
    if (!content || sending) return
    setSending(true)
    setDraft("")
    const { error } = await supabase.from("channel_messages").insert({ channel_id: id, sender_id: userId, content })
    if (error) setDraft(content)
    setSending(false)
  }

  if (loading) return <ActivityIndicator color={colors.navy} style={{ marginTop: 40 }} />

  if (!member) {
    return (
      <View style={styles.join}>
        <Text style={styles.title}>#{name}</Text>
        <Text style={styles.body}>Join to read history and post.</Text>
        <PrimaryButton label="Join channel" onPress={() => void join()} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.top}>
        <Text style={styles.topTitle}>#{name}</Text>
        <GhostButton label="Leave" onPress={() => void leave()} />
      </View>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListEmptyComponent={<EmptyState title="No messages" body="Say hello." />}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.sender_id === userId && styles.mine]}>
            <Text style={styles.author}>{one(item.profiles)?.full_name || "Member"}</Text>
            <Text style={[styles.msg, item.sender_id === userId && { color: colors.white }]}>{item.content}</Text>
          </View>
        )}
      />
      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Message"
          placeholderTextColor="rgba(0,0,0,0.32)"
          style={styles.input}
        />
        <PrimaryButton label="Send" loading={sending} onPress={() => void send()} />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  join: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 26, fontWeight: "700", color: colors.ink },
  body: { fontSize: 15, color: colors.muted, marginBottom: 8 },
  top: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.white,
  },
  topTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
  bubble: {
    maxWidth: "86%",
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 10,
  },
  mine: { alignSelf: "flex-end", backgroundColor: colors.navy, borderColor: colors.navy },
  author: { fontSize: 11, fontWeight: "600", color: colors.faint, marginBottom: 2 },
  msg: { fontSize: 15, lineHeight: 20, color: colors.ink },
  composer: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    color: colors.ink,
  },
})
