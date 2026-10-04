import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native"
import { Redirect } from "expo-router"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { one } from "@/lib/one"
import { CardBox, EmptyState, GhostButton, PrimaryButton } from "@/components/ui"
import { colors } from "@/lib/theme"

type Row = {
  id: string
  company_name: string | null
  description: string | null
  is_approved: boolean | null
  profiles?: { full_name?: string | null } | { full_name?: string | null }[] | null
}

export default function AdminRecruiters() {
  const { profile } = useSession()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("recruiter_profiles")
      .select("id, company_name, description, is_approved, profiles(full_name)")
      .order("created_at", { ascending: false })
    setRows((data ?? []) as Row[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const toggle = async (row: Row) => {
    setBusy(row.id)
    await supabase.from("recruiter_profiles").update({ is_approved: !row.is_approved }).eq("id", row.id)
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_approved: !row.is_approved } : r)))
    setBusy(null)
  }

  if (profile?.role !== "admin") return <Redirect href="/discover" />
  if (loading) return <ActivityIndicator color={colors.navy} style={{ marginTop: 40 }} />

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} />}
      ListEmptyComponent={<EmptyState title="No recruiter profiles" body="Company accounts land here for review." />}
      renderItem={({ item }) => (
        <CardBox>
          <Text style={styles.meta}>{item.is_approved ? "Approved" : "Pending"}</Text>
          <Text style={styles.title}>{item.company_name || "Company"}</Text>
          <Text style={styles.sub}>{one(item.profiles)?.full_name}</Text>
          {item.description ? <Text style={styles.body}>{item.description}</Text> : null}
          <View style={{ marginTop: 10 }}>
            {item.is_approved ? (
              <GhostButton label="Revoke" disabled={busy === item.id} onPress={() => void toggle(item)} />
            ) : (
              <PrimaryButton label="Approve" loading={busy === item.id} onPress={() => void toggle(item)} />
            )}
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
