import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, Linking, StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { jobTypeLabel } from "@/lib/format"
import { CardBox, EmptyState } from "@/components/ui"
import { ReportBlock } from "@/components/ReportBlock"
import { colors } from "@/lib/theme"

type Company = { id: string; company_name: string | null; description: string | null; hiring_focus: string | null; website_url: string | null; industry?: string | null }
type Job = { id: string; title: string; job_type: string; is_remote: boolean; location: string | null }

export default function CompanyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { session } = useSession()
  const [company, setCompany] = useState<Company | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    let recRes = await supabase
      .from("recruiter_profiles")
      .select("id, company_name, description, hiring_focus, website_url, industry")
      .eq("id", id)
      .maybeSingle()
    if (recRes.error) {
      recRes = await supabase
        .from("recruiter_profiles")
        .select("id, company_name, description, hiring_focus, website_url")
        .eq("id", id)
        .maybeSingle()
    }
    const { data: listings } = await supabase
      .from("jobs")
      .select("id, title, job_type, is_remote, location")
      .eq("recruiter_id", id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
    if (!recRes.data) {
      setError("Company not found")
      return
    }
    setCompany(recRes.data as Company)
    setJobs((listings ?? []) as Job[])
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  if (!company && !error) return <ActivityIndicator color={colors.navy} style={{ marginTop: 40 }} />
  if (!company) return <EmptyState title="Company unavailable" body={error || ""} />

  return (
    <FlatList
      data={jobs}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 40 }}
      ListHeaderComponent={
        <View style={{ marginBottom: 12, gap: 8 }}>
          <Text style={styles.title}>{company.company_name || "Company"}</Text>
          {company.industry ? <Text style={styles.meta}>{company.industry}</Text> : null}
          {company.hiring_focus ? <Text style={styles.meta}>{company.hiring_focus}</Text> : null}
          {company.description ? <Text style={styles.body}>{company.description}</Text> : null}
          {company.website_url ? (
            <Text style={styles.link} onPress={() => void Linking.openURL(company.website_url!)}>
              {company.website_url}
            </Text>
          ) : null}
          {session?.user.id && id && session.user.id !== id ? (
            <ReportBlock currentUserId={session.user.id} peerId={id} peerName={company.company_name} />
          ) : null}
          <Text style={styles.section}>Open roles</Text>
        </View>
      }
      ListEmptyComponent={<EmptyState title="No live roles" body="This team doesn’t have an active listing right now." />}
      renderItem={({ item }) => (
        <CardBox onPress={() => router.push(`/job/${item.id}`)}>
          <Text style={styles.jobMeta}>
            {jobTypeLabel(item.job_type)}
            {item.is_remote ? " · Remote" : item.location ? ` · ${item.location}` : ""}
          </Text>
          <Text style={styles.jobTitle}>{item.title}</Text>
        </CardBox>
      )}
    />
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.8, color: colors.ink },
  meta: { fontSize: 14, color: colors.navy },
  body: { fontSize: 15, lineHeight: 22, color: colors.ink },
  link: { fontSize: 13, color: colors.navy },
  section: {
    marginTop: 16,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.faint,
  },
  jobMeta: { fontSize: 12, fontWeight: "600", color: colors.navy, textTransform: "capitalize" },
  jobTitle: { marginTop: 4, fontSize: 16, fontWeight: "600", color: colors.ink },
})
