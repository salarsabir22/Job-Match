import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native"
import { Redirect, useRouter } from "expo-router"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { CardBox, EmptyState, GhostButton } from "@/components/ui"
import { colors } from "@/lib/theme"

export default function AdminHome() {
  const router = useRouter()
  const { profile } = useSession()
  const [stats, setStats] = useState<{ label: string; value: string }[]>([])
  const [pending, setPending] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [{ data: profiles }, { count: jobs }, { count: matches }, { count: waiting }] = await Promise.all([
      supabase.from("profiles").select("role"),
      supabase.from("jobs").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("matches").select("id", { count: "exact", head: true }),
      supabase.from("recruiter_profiles").select("id", { count: "exact", head: true }).eq("is_approved", false),
    ])
    const all = profiles ?? []
    setStats([
      { label: "Users", value: String(all.length) },
      { label: "Students", value: String(all.filter((p) => p.role === "student").length) },
      { label: "Recruiters", value: String(all.filter((p) => p.role === "recruiter").length) },
      { label: "Active jobs", value: String(jobs ?? 0) },
      { label: "Matches", value: String(matches ?? 0) },
    ])
    setPending(waiting ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (profile?.role !== "admin") return <Redirect href="/discover" />
  if (loading) return <ActivityIndicator color={colors.navy} style={{ marginTop: 40 }} />

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.grid}>
        {stats.map((s) => (
          <View key={s.label} style={styles.card}>
            <Text style={styles.value}>{s.value}</Text>
            <Text style={styles.label}>{s.label}</Text>
          </View>
        ))}
      </View>
      {pending ? <EmptyState title={`${pending} recruiters waiting`} body="Approve company accounts before their jobs go live." /> : null}
      <CardBox onPress={() => router.push("/admin/users")}>
        <Text style={styles.row}>Users</Text>
      </CardBox>
      <CardBox onPress={() => router.push("/admin/recruiters")}>
        <Text style={styles.row}>Recruiter approvals</Text>
      </CardBox>
      <CardBox onPress={() => router.push("/admin/channels")}>
        <Text style={styles.row}>Community channels</Text>
      </CardBox>
      <CardBox onPress={() => router.push("/admin/reports")}>
        <Text style={styles.row}>Reports</Text>
      </CardBox>
      <GhostButton label="Back to app" onPress={() => router.push("/discover")} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  wrap: { padding: 20, gap: 10, paddingBottom: 40 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  card: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  value: { fontSize: 26, fontWeight: "700", color: colors.ink },
  label: { marginTop: 4, fontSize: 13, color: colors.muted },
  row: { fontSize: 16, fontWeight: "600", color: colors.ink },
})
