import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native"
import { Redirect } from "expo-router"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { CardBox, Chip, EmptyState } from "@/components/ui"
import { colors } from "@/lib/theme"

type Row = {
  id: string
  reason: string
  details: string | null
  status: string
  reporter_id: string
  reported_id: string
}

export default function AdminReports() {
  const { profile } = useSession()
  const [rows, setRows] = useState<Row[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("reports")
      .select("id, reason, details, status, reporter_id, reported_id")
      .order("created_at", { ascending: false })
      .limit(100)
    const list = (data ?? []) as Row[]
    setRows(list)
    const ids = [...new Set(list.flatMap((r) => [r.reporter_id, r.reported_id]))]
    if (ids.length) {
      const { data: people } = await supabase.from("profiles").select("id, full_name").in("id", ids)
      const map: Record<string, string> = {}
      for (const p of people ?? []) map[p.id as string] = (p.full_name as string) || "Member"
      setNames(map)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const setStatus = async (id: string, status: string) => {
    await supabase.from("reports").update({ status }).eq("id", id)
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  if (profile?.role !== "admin") return <Redirect href="/discover" />
  if (loading) return <ActivityIndicator color={colors.navy} style={{ marginTop: 40 }} />

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} />}
      ListEmptyComponent={<EmptyState title="No reports" body="Safety reports from students and recruiters land here." />}
      renderItem={({ item }) => (
        <CardBox>
          <Text style={styles.meta}>{item.reason.replace(/_/g, " ")} · {item.status}</Text>
          <Text style={styles.title}>{names[item.reported_id] || "Reported user"}</Text>
          <Text style={styles.sub}>From {names[item.reporter_id] || "someone"}</Text>
          {item.details ? <Text style={styles.body}>{item.details}</Text> : null}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {["open", "reviewed", "actioned", "dismissed"].map((s) => (
              <Chip key={s} label={s} selected={item.status === s} onPress={() => void setStatus(item.id, s)} />
            ))}
          </View>
        </CardBox>
      )}
    />
  )
}

const styles = StyleSheet.create({
  meta: { fontSize: 11, fontWeight: "600", color: colors.navy, textTransform: "capitalize" },
  title: { marginTop: 4, fontSize: 16, fontWeight: "600", color: colors.ink },
  sub: { marginTop: 4, fontSize: 13, color: colors.muted },
  body: { marginTop: 8, fontSize: 14, lineHeight: 20, color: colors.ink },
})
