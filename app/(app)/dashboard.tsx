import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { EmptyState } from "@/components/ui"
import { colors } from "@/lib/theme"

function daysLastN(n: number) {
  const out: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i))
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

function weekOverWeekHint(currentWindow: number, priorWindow: number) {
  if (currentWindow === 0 && priorWindow === 0) return null
  if (priorWindow === 0 && currentWindow > 0) return "First activity this week"
  const delta = currentWindow - priorWindow
  const pct = Math.round((delta / priorWindow) * 100)
  if (delta === 0) return "Flat vs prior week"
  if (delta > 0) return `↑ ${pct}% vs prior week`
  return `↓ ${Math.abs(pct)}% vs prior week`
}

export default function DashboardScreen() {
  const { session, profile } = useSession()
  const recruiter = profile?.role === "recruiter"
  const userId = session!.user.id
  const [stats, setStats] = useState<{ label: string; value: string; hint?: string }[]>([])
  const [bars, setBars] = useState<{ day: string; primary: number; secondary: number }[]>([])
  const [funnel, setFunnel] = useState<{ label: string; value: number }[]>([])
  const [footnote, setFootnote] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const days = daysLastN(30)
      const since = `${days[0]}T00:00:00.000Z`
      const weekDays = days.slice(-7)
      const priorDays = days.slice(-14, -7)
      if (recruiter) {
        const { data: myJobs } = await supabase.from("jobs").select("id").eq("recruiter_id", userId)
        const jobIds = (myJobs ?? []).map((j) => j.id as string)
        const [{ count: jobs }, matchRowsRes, appsTimeline, matchTimeline] = await Promise.all([
          supabase.from("jobs").select("id", { count: "exact", head: true }).eq("recruiter_id", userId).eq("is_active", true),
          supabase.from("matches").select("created_at, pipeline_status").eq("recruiter_id", userId),
          jobIds.length
            ? supabase.from("job_swipes").select("created_at").in("job_id", jobIds).eq("direction", "right").gte("created_at", since)
            : Promise.resolve({ data: [] as { created_at: string }[] }),
          supabase.from("matches").select("created_at").eq("recruiter_id", userId).gte("created_at", since),
        ])
        const matchAll = (matchRowsRes.data ?? []) as { created_at: string; pipeline_status?: string | null }[]
        const appRows = (appsTimeline.data ?? []) as { created_at: string }[]
        const matchRows = (matchTimeline.data ?? []) as { created_at: string }[]
        const series = days.map((day) => ({
          day,
          primary: appRows.filter((r) => r.created_at?.slice(0, 10) === day).length,
          secondary: matchRows.filter((r) => r.created_at?.slice(0, 10) === day).length,
        }))
        setBars(series)
        const weekApps = series.filter((d) => weekDays.includes(d.day)).reduce((acc, d) => acc + d.primary, 0)
        const priorApps = series.filter((d) => priorDays.includes(d.day)).reduce((acc, d) => acc + d.primary, 0)
        const weekMatches = series.filter((d) => weekDays.includes(d.day)).reduce((acc, d) => acc + d.secondary, 0)
        const priorMatches = series.filter((d) => priorDays.includes(d.day)).reduce((acc, d) => acc + d.secondary, 0)
        setStats([
          { label: "Active listings", value: String(jobs ?? 0) },
          { label: "Mutual matches", value: String(matchAll.length), hint: weekOverWeekHint(weekMatches, priorMatches) ?? undefined },
          { label: "Applications", value: String(appRows.length), hint: weekOverWeekHint(weekApps, priorApps) ?? undefined },
        ])
        const interview = matchAll.filter((m) => m.pipeline_status === "interview").length
        const hired = matchAll.filter((m) => m.pipeline_status === "hired").length
        setFunnel([
          { label: "Applied", value: appRows.length },
          { label: "Matched", value: matchAll.length },
          { label: "Interview", value: interview },
          { label: "Hired", value: hired },
        ])
        const sumApps = series.reduce((acc, d) => acc + d.primary, 0)
        const sumMatches = series.reduce((acc, d) => acc + d.secondary, 0)
        setFootnote(`Last 30 days: ${sumApps} applications · ${sumMatches} new matches.`)
      } else {
        const [{ count: applied }, { count: saved }, { count: matches }, { count: views }, swipeTimeline, matchTimeline] =
          await Promise.all([
            supabase.from("job_swipes").select("id", { count: "exact", head: true }).eq("student_id", userId).eq("direction", "right"),
            supabase.from("job_swipes").select("id", { count: "exact", head: true }).eq("student_id", userId).eq("direction", "saved"),
            supabase.from("matches").select("id", { count: "exact", head: true }).eq("student_id", userId),
            supabase.from("profile_views").select("id", { count: "exact", head: true }).eq("student_id", userId),
            supabase.from("job_swipes").select("created_at, direction").eq("student_id", userId).gte("created_at", since),
            supabase.from("matches").select("created_at").eq("student_id", userId).gte("created_at", since),
          ])
        const swipes = (swipeTimeline.data ?? []) as { created_at: string; direction: string }[]
        const matchRows = (matchTimeline.data ?? []) as { created_at: string }[]
        const series = days.map((day) => ({
          day,
          primary: swipes.filter((r) => r.created_at?.slice(0, 10) === day && r.direction === "right").length,
          secondary: matchRows.filter((r) => r.created_at?.slice(0, 10) === day).length,
        }))
        setBars(series)
        const weekApplied = series.filter((d) => weekDays.includes(d.day)).reduce((acc, d) => acc + d.primary, 0)
        const priorApplied = series.filter((d) => priorDays.includes(d.day)).reduce((acc, d) => acc + d.primary, 0)
        const weekMatches = series.filter((d) => weekDays.includes(d.day)).reduce((acc, d) => acc + d.secondary, 0)
        const priorMatches = series.filter((d) => priorDays.includes(d.day)).reduce((acc, d) => acc + d.secondary, 0)
        const appliedCount = applied ?? 0
        const matchCount = matches ?? 0
        const rate = appliedCount <= 0 ? 0 : Math.min(100, Math.round((matchCount / appliedCount) * 100))
        setStats([
          { label: "Interested", value: String(appliedCount), hint: weekOverWeekHint(weekApplied, priorApplied) ?? undefined },
          { label: "Saved", value: String(saved ?? 0) },
          { label: "Matches", value: String(matchCount), hint: weekOverWeekHint(weekMatches, priorMatches) ?? undefined },
          { label: "Profile views", value: String(views ?? 0) },
        ])
        setFunnel([
          { label: "Applied", value: appliedCount },
          { label: "Matched", value: matchCount },
          { label: "Match rate", value: rate },
        ])
        const sumApplied = series.reduce((acc, d) => acc + d.primary, 0)
        const sumMatches = series.reduce((acc, d) => acc + d.secondary, 0)
        setFootnote(`Last 30 days: ${sumApplied} applications · ${sumMatches} new matches.`)
      }
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t load insights")
    }
    setLoading(false)
  }, [recruiter, userId])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) return <ActivityIndicator color={colors.navy} style={{ marginTop: 40 }} />
  if (error) return <EmptyState title="Insights unavailable" body={error} />

  const maxBar = Math.max(1, ...bars.map((b) => b.primary + b.secondary))
  const maxFunnel = Math.max(1, ...funnel.map((f) => f.value))

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.lede}>Same numbers as the website dashboard — pulled live from swypejobs.</Text>
      <View style={styles.grid}>
        {stats.map((s) => (
          <View key={s.label} style={styles.card}>
            <Text style={styles.value}>{s.value}</Text>
            <Text style={styles.label}>{s.label}</Text>
            {s.hint ? <Text style={styles.hint}>{s.hint}</Text> : null}
          </View>
        ))}
      </View>
      {funnel.length ? (
        <View style={styles.chart}>
          <Text style={styles.chartTitle}>Funnel</Text>
          {funnel.map((f) => (
            <View key={f.label} style={styles.funnelRow}>
              <Text style={styles.funnelLabel}>
                {f.label}
                {f.label === "Match rate" ? ` ${f.value}%` : ` ${f.value}`}
              </Text>
              <View style={styles.funnelTrack}>
                <View
                  style={[
                    styles.funnelFill,
                    { width: `${Math.max(8, Math.round((f.value / maxFunnel) * 100))}%` },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      ) : null}
      {bars.length ? (
        <View style={styles.chart}>
          <Text style={styles.chartTitle}>{recruiter ? "Inbound vs matches · 30 days" : "Applications vs matches · 30 days"}</Text>
          <View style={styles.barRow}>
            {bars.map((b, i) => (
              <View key={b.day} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: Math.max(2, Math.round(((b.primary + b.secondary) / maxBar) * 96)) },
                    ]}
                  />
                </View>
                {i % 5 === 0 ? <Text style={styles.barLabel}>{b.day.slice(5)}</Text> : <View style={{ height: 12 }} />}
              </View>
            ))}
          </View>
          {footnote ? <Text style={styles.footnote}>{footnote}</Text> : null}
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 40 },
  lede: { fontSize: 14, lineHeight: 20, color: colors.muted, marginBottom: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    minHeight: 96,
  },
  value: { fontSize: 28, fontWeight: "700", color: colors.ink, letterSpacing: -0.8 },
  label: { marginTop: 6, fontSize: 13, color: colors.muted },
  hint: { marginTop: 4, fontSize: 11, color: colors.navy },
  chart: {
    marginTop: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  chartTitle: { fontSize: 14, fontWeight: "600", color: colors.ink, marginBottom: 12 },
  barRow: { flexDirection: "row", alignItems: "flex-end", gap: 2, height: 120 },
  barCol: { flex: 1, alignItems: "center", gap: 4, height: "100%" },
  barTrack: {
    height: 96,
    width: "100%",
    borderRadius: 3,
    backgroundColor: colors.bg,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: { width: "100%", backgroundColor: colors.navy, borderRadius: 3 },
  barLabel: { fontSize: 8, color: colors.muted },
  footnote: { marginTop: 12, fontSize: 12, lineHeight: 18, color: colors.muted },
  funnelRow: { marginBottom: 10 },
  funnelLabel: { fontSize: 12, color: colors.muted, marginBottom: 4 },
  funnelTrack: { height: 8, borderRadius: 4, backgroundColor: colors.bg, overflow: "hidden" },
  funnelFill: { height: 8, borderRadius: 4, backgroundColor: colors.navy },
})
