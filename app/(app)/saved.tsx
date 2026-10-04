import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text } from "react-native"
import { useRouter } from "expo-router"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { one } from "@/lib/one"
import { jobTypeLabel } from "@/lib/format"
import { undoJobSwipe } from "@/lib/swipe"
import { CardBox, EmptyState, GhostButton } from "@/components/ui"
import { colors } from "@/lib/theme"

type Row = {
  id: string
  job_id: string
  jobs?: {
    id?: string
    title?: string
    job_type?: string
    is_remote?: boolean
    location?: string | null
    recruiter_id?: string
    recruiter_profiles?: { company_name?: string | null } | { company_name?: string | null }[] | null
  } | {
    id?: string
    title?: string
    job_type?: string
    is_remote?: boolean
    location?: string | null
    recruiter_id?: string
    recruiter_profiles?: { company_name?: string | null } | { company_name?: string | null }[] | null
  }[] | null
}

export default function SavedScreen() {
  const router = useRouter()
  const { session } = useSession()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("job_swipes")
      .select("id, job_id, jobs(id, title, job_type, is_remote, location, recruiter_id, recruiter_profiles(company_name))")
      .eq("student_id", session!.user.id)
      .eq("direction", "saved")
      .order("created_at", { ascending: false })
    setRows((data ?? []) as Row[])
    setLoading(false)
  }, [session])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) return <ActivityIndicator color={colors.navy} style={{ marginTop: 40 }} />

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} />}
      ListEmptyComponent={<EmptyState title="Nothing saved" body="Save a role from Discover and it will wait here." />}
      renderItem={({ item }) => {
        const job = one(item.jobs)
        return (
          <CardBox onPress={() => job?.id && router.push(`/job/${job.id}`)}>
            <Text style={styles.meta}>
              {jobTypeLabel(job?.job_type)}
              {job?.is_remote ? " · Remote" : job?.location ? ` · ${job.location}` : ""}
            </Text>
            <Text style={styles.title}>{job?.title || "Role"}</Text>
            <Text style={styles.company}>{one(job?.recruiter_profiles)?.company_name}</Text>
            <GhostButton
              label="Apply"
              onPress={() => {
                void (async () => {
                  await supabase.from("job_swipes").delete().eq("id", item.id).eq("student_id", session!.user.id)
                  await supabase.from("job_swipes").insert({
                    student_id: session!.user.id,
                    job_id: item.job_id,
                    direction: "right",
                  })
                  await load()
                })()
              }}
            />
            <GhostButton
              label="Remove"
              onPress={() => {
                void (async () => {
                  await undoJobSwipe(supabase, {
                    studentId: session!.user.id,
                    recruiterId: job?.recruiter_id || "",
                    jobId: item.job_id,
                  })
                  await load()
                })()
              }}
            />
          </CardBox>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  meta: { fontSize: 12, fontWeight: "600", color: colors.navy, textTransform: "capitalize" },
  title: { marginTop: 4, fontSize: 16, fontWeight: "600", color: colors.ink },
  company: { marginTop: 4, marginBottom: 10, fontSize: 13, color: colors.muted },
})
