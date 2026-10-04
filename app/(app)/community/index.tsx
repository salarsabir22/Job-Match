import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text } from "react-native"
import { useRouter } from "expo-router"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { CardBox, EmptyState } from "@/components/ui"
import { colors } from "@/lib/theme"

type Channel = {
  id: string
  name: string
  description: string | null
  category: string | null
  channel_members?: { user_id: string }[] | null
}

export default function CommunityScreen() {
  const router = useRouter()
  const { session } = useSession()
  const [channels, setChannels] = useState<Channel[]>([])
  const [joined, setJoined] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [{ data, error: loadError }, { data: memberships }] = await Promise.all([
      supabase.from("community_channels").select("id, name, description, category, channel_members(user_id)").order("name"),
      supabase.from("channel_members").select("channel_id").eq("user_id", session!.user.id),
    ])
    if (loadError) setError(loadError.message)
    else {
      setError(null)
      setChannels((data ?? []) as Channel[])
    }
    setJoined(new Set((memberships ?? []).map((m) => m.channel_id as string)))
    setLoading(false)
  }, [session])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) return <ActivityIndicator color={colors.navy} style={{ marginTop: 40 }} />

  return (
    <FlatList
      data={channels}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} />}
      ListEmptyComponent={
        <EmptyState title={error ? "Couldn’t load channels" : "No channels yet"} body={error ?? "Community rooms will show here."} />
      }
      renderItem={({ item }) => (
        <CardBox onPress={() => router.push(`/community/${item.id}`)}>
          <Text style={styles.meta}>
            {(item.category || "general").replace(/_/g, " ")}
            {joined.has(item.id) ? " · Joined" : ""}
          </Text>
          <Text style={styles.title}>#{item.name}</Text>
          {item.description ? <Text style={styles.body}>{item.description}</Text> : null}
          <Text style={styles.count}>{item.channel_members?.length ?? 0} members</Text>
        </CardBox>
      )}
    />
  )
}

const styles = StyleSheet.create({
  meta: { fontSize: 11, fontWeight: "600", color: colors.navy, textTransform: "capitalize" },
  title: { marginTop: 4, fontSize: 18, fontWeight: "700", color: colors.ink },
  body: { marginTop: 6, fontSize: 14, lineHeight: 20, color: colors.muted },
  count: { marginTop: 8, fontSize: 12, color: colors.faint },
})
