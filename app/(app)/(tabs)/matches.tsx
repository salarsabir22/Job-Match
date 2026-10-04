import { useCallback, useEffect, useMemo, useState } from "react"
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { one } from "@/lib/one"
import { applicationStatus, PIPELINE_LABEL, PIPELINE_STAGES, PIPELINE_TABS, type PipelineTab } from "@/lib/format"
import { CardBox, Chip, EmptyState, Field, GhostButton, PageHeader, Screen } from "@/components/ui"
import { colors } from "@/lib/theme"

type MatchRow = {
  id: string
  job_id: string
  student_id: string
  recruiter_id: string
  pipeline_status?: string | null
  is_archived?: boolean | null
  is_shortlisted?: boolean | null
  recruiter_notes?: string | null
  conversations?: { id: string } | { id: string }[] | null
  jobs?: { title?: string | null; recruiter_id?: string | null } | { title?: string | null; recruiter_id?: string | null }[] | null
}

type ApplicationRow = {
  id: string
  job_id: string
  created_at: string
  jobs?: {
    title?: string | null
    recruiter_id?: string | null
    recruiter_profiles?: { company_name?: string | null } | { company_name?: string | null }[] | null
  } | {
    title?: string | null
    recruiter_id?: string | null
    recruiter_profiles?: { company_name?: string | null } | { company_name?: string | null }[] | null
  }[] | null
}

export default function MatchesScreen() {
  const { profile } = useSession()
  if (profile?.role === "recruiter") return <RecruiterPipeline />
  return <StudentApplications />
}

function StudentApplications() {
  const router = useRouter()
  const { session } = useSession()
  const userId = session!.user.id
  const [apps, setApps] = useState<ApplicationRow[]>([])
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [viewed, setViewed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [appsRes, matchRes, viewsRes] = await Promise.all([
      supabase
        .from("job_swipes")
        .select("id, job_id, created_at, jobs(title, recruiter_id, recruiter_profiles(company_name))")
        .eq("student_id", userId)
        .eq("direction", "right")
        .order("created_at", { ascending: false }),
      supabase
        .from("matches")
        .select("id, job_id, student_id, recruiter_id, pipeline_status, is_archived, conversations(id), jobs(title)")
        .eq("student_id", userId),
      supabase.from("profile_views").select("viewer_id").eq("student_id", userId),
    ])
    if (appsRes.error) {
      setError(appsRes.error.message)
      setApps([])
    } else {
      setError(null)
      setApps((appsRes.data ?? []) as ApplicationRow[])
    }
    setMatches((matchRes.data ?? []) as MatchRow[])
    setViewed(new Set((viewsRes.data ?? []).map((v) => v.viewer_id as string)))
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  const matchByJob = useMemo(() => new Map(matches.map((m) => [m.job_id, m])), [matches])

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <PageHeader kicker="Applications" title="When both sides said yes" />
        {loading ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: 32 }} />
        ) : (
          <FlatList
            data={apps}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 32, gap: 10 }}
            refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} />}
            ListEmptyComponent={
              <EmptyState
                title={error ? "Couldn’t load applications" : "No applications yet"}
                body={error ?? "Swipe Interested on Discover. Status moves to chatting when a recruiter likes you back."}
              />
            }
            renderItem={({ item }) => {
              const job = one(item.jobs)
              const match = matchByJob.get(item.job_id)
              const convo = match ? one(match.conversations)?.id : null
              const status = applicationStatus({
                hasMatch: Boolean(match),
                pipeline: match?.pipeline_status,
                viewed: Boolean(job?.recruiter_id && viewed.has(job.recruiter_id)),
                archived: Boolean(match?.is_archived),
              })
              return (
                <CardBox
                  onPress={() => {
                    if (convo) router.push(`/chat/${convo}`)
                    else router.push(`/job/${item.job_id}`)
                  }}
                >
                  <Text style={styles.meta}>{status}</Text>
                  <Text style={styles.rowTitle}>{job?.title || "Role"}</Text>
                  <Text style={styles.sub}>{one(job?.recruiter_profiles)?.company_name || "Company"}</Text>
                  <Text style={styles.cta}>{convo ? "Open chat" : "Waiting on a match"}</Text>
                </CardBox>
              )
            }}
          />
        )}
      </SafeAreaView>
    </Screen>
  )
}

function RecruiterPipeline() {
  const router = useRouter()
  const { session } = useSession()
  const userId = session!.user.id
  const [rows, setRows] = useState<MatchRow[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [stage, setStage] = useState<PipelineTab>("chatting")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from("matches")
      .select("id, job_id, student_id, recruiter_id, pipeline_status, is_archived, is_shortlisted, recruiter_notes, conversations(id), jobs(title)")
      .eq("recruiter_id", userId)
      .order("created_at", { ascending: false })
    if (loadError) {
      setError(loadError.message)
      setRows([])
      setLoading(false)
      return
    }
    const list = (data ?? []) as MatchRow[]
    setRows(list)
    const ids = [...new Set(list.map((m) => m.student_id))]
    if (ids.length) {
      const { data: people } = await supabase.from("profiles").select("id, full_name").in("id", ids)
      const map: Record<string, string> = {}
      for (const p of people ?? []) map[p.id as string] = (p.full_name as string) || "Student"
      setNames(map)
    }
    setError(null)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  const visible = rows.filter((m) => {
    if (stage === "archived") return Boolean(m.is_archived)
    if (m.is_archived) return false
    const status = m.pipeline_status || "chatting"
    return status === stage
  })

  const setPipeline = async (matchId: string, status: (typeof PIPELINE_STAGES)[number]) => {
    setBusyId(matchId)
    await supabase.from("matches").update({ pipeline_status: status, is_archived: false }).eq("id", matchId)
    setRows((prev) => prev.map((m) => (m.id === matchId ? { ...m, pipeline_status: status, is_archived: false } : m)))
    setBusyId(null)
  }

  const toggleArchive = async (match: MatchRow) => {
    setBusyId(match.id)
    const next = !match.is_archived
    await supabase.from("matches").update({ is_archived: next }).eq("id", match.id)
    setRows((prev) => prev.map((m) => (m.id === match.id ? { ...m, is_archived: next } : m)))
    setBusyId(null)
  }

  const toggleStar = async (match: MatchRow) => {
    setBusyId(match.id)
    const next = !match.is_shortlisted
    await supabase.from("matches").update({ is_shortlisted: next }).eq("id", match.id)
    setRows((prev) => prev.map((m) => (m.id === match.id ? { ...m, is_shortlisted: next } : m)))
    setBusyId(null)
  }

  const saveNotes = async (matchId: string, notes: string) => {
    await supabase.from("matches").update({ recruiter_notes: notes }).eq("id", matchId)
    setRows((prev) => prev.map((m) => (m.id === matchId ? { ...m, recruiter_notes: notes } : m)))
  }

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <PageHeader kicker="Pipeline" title="Mutual matches" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {PIPELINE_TABS.map((tab) => (
            <Chip
              key={tab}
              label={`${PIPELINE_LABEL[tab]} ${
                tab === "archived"
                  ? rows.filter((m) => m.is_archived).length
                  : rows.filter((m) => !m.is_archived && (m.pipeline_status || "chatting") === tab).length
              }`}
              selected={stage === tab}
              onPress={() => setStage(tab)}
            />
          ))}
        </ScrollView>
        {loading ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: 32 }} />
        ) : (
          <FlatList
            data={visible}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 32, gap: 10 }}
            refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} />}
            ListEmptyComponent={
              <EmptyState
                title={error ? "Couldn’t load pipeline" : "Nobody in this stage"}
                body={error ?? "Matches land in Chat after both sides swipe yes. Move them through interview, offer, and hired."}
              />
            }
            renderItem={({ item }) => {
              const job = one(item.jobs)?.title || "Role"
              const convo = one(item.conversations)?.id
              const busy = busyId === item.id
              return (
                <CardBox>
                  <Text style={styles.meta}>
                    {item.is_shortlisted ? "Starred · " : ""}
                    {item.pipeline_status?.replace(/_/g, " ") || "chatting"}
                  </Text>
                  <Text style={styles.rowTitle}>{names[item.student_id] || "Student"}</Text>
                  <Text style={styles.sub}>{job}</Text>
                  <NotesField
                    matchId={item.id}
                    initial={item.recruiter_notes || ""}
                    onSave={saveNotes}
                    disabled={busy}
                  />
                  <View style={styles.stageRow}>
                    {PIPELINE_STAGES.map((s) => (
                      <Chip
                        key={s}
                        label={PIPELINE_LABEL[s]}
                        selected={(item.pipeline_status || "chatting") === s && !item.is_archived}
                        onPress={() => void setPipeline(item.id, s)}
                      />
                    ))}
                  </View>
                  <View style={styles.rowActions}>
                    <GhostButton
                      label={convo ? "Open chat" : "No thread yet"}
                      onPress={() => {
                        if (convo) router.push(`/chat/${convo}`)
                      }}
                      disabled={!convo || busy}
                    />
                    <GhostButton label="Profile" onPress={() => router.push(`/candidate/${item.student_id}`)} disabled={busy} />
                  </View>
                  <View style={styles.rowActions}>
                    <GhostButton
                      label={item.is_shortlisted ? "Unstar" : "Star"}
                      onPress={() => void toggleStar(item)}
                      disabled={busy}
                    />
                    <GhostButton
                      label={item.is_archived ? "Unarchive" : "Archive"}
                      onPress={() => void toggleArchive(item)}
                      disabled={busy}
                    />
                  </View>
                </CardBox>
              )
            }}
          />
        )}
      </SafeAreaView>
    </Screen>
  )
}

function NotesField({
  matchId,
  initial,
  onSave,
  disabled,
}: {
  matchId: string
  initial: string
  onSave: (matchId: string, notes: string) => Promise<void>
  disabled?: boolean
}) {
  const [value, setValue] = useState(initial)
  useEffect(() => {
    setValue(initial)
  }, [initial])
  return (
    <Field
      label="Private notes"
      value={value}
      onChangeText={setValue}
      onBlur={() => {
        if (value !== initial) void onSave(matchId, value)
      }}
      multiline
      editable={!disabled}
      style={{ minHeight: 64, textAlignVertical: "top", paddingTop: 12, marginTop: 8 }}
    />
  )
}

const styles = StyleSheet.create({
  chips: { paddingHorizontal: 22, gap: 8, paddingBottom: 12 },
  meta: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.navy,
    textTransform: "capitalize",
  },
  rowTitle: {
    marginTop: 6,
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
  cta: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "500",
    color: colors.navy,
  },
  stageRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  rowActions: { flexDirection: "row", gap: 8, marginTop: 10 },
})
