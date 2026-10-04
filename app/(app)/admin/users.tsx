import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text } from "react-native"
import { Redirect } from "expo-router"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { CardBox, EmptyState } from "@/components/ui"
import { colors } from "@/lib/theme"

type Row = { id: string; full_name: string | null; role: string | null; created_at: string }

export default function AdminUsers() {
  const { profile } = useSession()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role, created_at")
      .order("created_at", { ascending: false })
      .limit(200)
    setRows((data ?? []) as Row[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (profile?.role !== "admin") return <Redirect href="/discover" />
  if (loading) return <ActivityIndicator color={colors.navy} style={{ marginTop: 40 }} />

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} />}
      ListEmptyComponent={<EmptyState title="No users" body="New accounts will appear here." />}
      renderItem={({ item }) => (
        <CardBox>
          <Text style={styles.meta}>{(item.role || "member").replace(/_/g, " ")}</Text>
          <Text style={styles.title}>{item.full_name || "Unnamed"}</Text>
        </CardBox>
      )}
    />
  )
}

const styles = StyleSheet.create({
  meta: { fontSize: 11, fontWeight: "600", color: colors.navy, textTransform: "capitalize" },
  title: { marginTop: 4, fontSize: 16, fontWeight: "600", color: colors.ink },
})
