import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native"
import { Redirect } from "expo-router"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { CardBox, EmptyState, Field, GhostButton, PrimaryButton } from "@/components/ui"
import { colors } from "@/lib/theme"

type Row = { id: string; name: string; description: string | null; category: string | null }

export default function AdminChannels() {
  const { session, profile } = useSession()
  const [rows, setRows] = useState<Row[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from("community_channels").select("id, name, description, category").order("name")
    setRows((data ?? []) as Row[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const create = async () => {
    if (!name.trim()) return
    setSaving(true)
    await supabase.from("community_channels").insert({
      name: name.trim().toLowerCase().replace(/\s+/g, "-"),
      description: description.trim() || null,
      category: "general",
      created_by: session!.user.id,
    })
    setName("")
    setDescription("")
    setSaving(false)
    await load()
  }

  const remove = async (id: string) => {
    await supabase.from("community_channels").delete().eq("id", id)
    await load()
  }

  if (profile?.role !== "admin") return <Redirect href="/discover" />
  if (loading) return <ActivityIndicator color={colors.navy} style={{ marginTop: 40 }} />

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} />}
      ListHeaderComponent={
        <View style={{ gap: 10, marginBottom: 12 }}>
          <Field label="Channel name" value={name} onChangeText={setName} autoCapitalize="none" />
          <Field label="Description" value={description} onChangeText={setDescription} autoCapitalize="sentences" />
          <PrimaryButton label="Create channel" loading={saving} onPress={() => void create()} />
        </View>
      }
      ListEmptyComponent={<EmptyState title="No channels" body="Create a room for campus talk." />}
      renderItem={({ item }) => (
        <CardBox>
          <Text style={styles.title}>#{item.name}</Text>
          {item.description ? <Text style={styles.body}>{item.description}</Text> : null}
          <View style={{ marginTop: 10 }}>
            <GhostButton label="Delete" onPress={() => void remove(item.id)} />
          </View>
        </CardBox>
      )}
    />
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: "700", color: colors.ink },
  body: { marginTop: 6, fontSize: 14, color: colors.muted },
})
