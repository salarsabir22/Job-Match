import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { CardBox, EmptyState, PageHeader, PrimaryButton, Screen } from "@/components/ui"
import { colors } from "@/lib/theme"

type Job = {
  id: string
  title: string
  is_active: boolean
  job_type: string
  location: string | null
  is_remote: boolean
}

export default function JobsScreen() {
  const router = useRouter()
  const { session } = useSession()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from("jobs")
      .select("id, title, is_active, job_type, location, is_remote")
      .eq("recruiter_id", session!.user.id)
      .order("created_at", { ascending: false })
    if (loadError) setError(loadError.message)
    else {
      setError(null)
      setJobs((data ?? []) as Job[])
    }
    setLoading(false)
  }, [session])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <PageHeader
          kicker="Jobs"
          title="Your listings"
          right={<PrimaryButton label="Post" onPress={() => router.push("/job/new")} />}
        />
        {loading ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: 32 }} />
        ) : (
          <FlatList
            data={jobs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 32, gap: 10 }}
            refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} />}
            ListEmptyComponent={
              <EmptyState
                title={error ? "Couldn’t load jobs" : "No listings yet"}
                body={error ?? "Post an internship or new-grad role. Students will see it on Discover."}
              />
            }
            renderItem={({ item }) => (
              <CardBox onPress={() => router.push(`/job/${item.id}`)}>
                <Text style={styles.meta}>
                  {item.is_active ? "Active" : "Paused"} · {item.job_type.replace(/_/g, " ")}
                  {item.is_remote ? " · Remote" : item.location ? ` · ${item.location}` : ""}
                </Text>
                <Text style={styles.titleRow}>{item.title}</Text>
              </CardBox>
            )}
          />
        )}
      </SafeAreaView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  meta: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.navy,
    textTransform: "capitalize",
  },
  titleRow: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
    color: colors.ink,
  },
})
