import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { one } from "@/lib/one"
import { EmptyState, GhostButton } from "@/components/ui"
import { ReportBlock } from "@/components/ReportBlock"
import { recordProfileView } from "@/lib/engagement"
import { signedUrl } from "@/lib/upload"
import { MediaPlayer } from "@/components/MediaPlayer"
import { colors } from "@/lib/theme"

type Row = {
  id: string
  university: string | null
  degree: string | null
  graduation_year: number | null
  skills: string[] | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  resume_url?: string | null
  profiles?:
    | { full_name?: string | null; bio?: string | null; profile_video_url?: string | null }
    | { full_name?: string | null; bio?: string | null; profile_video_url?: string | null }[]
    | null
}

export default function CandidateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useSession()
  const [row, setRow] = useState<Row | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from("student_profiles")
      .select("id, university, degree, graduation_year, skills, linkedin_url, github_url, portfolio_url, resume_url, profiles!inner(full_name, bio, profile_video_url)")
      .eq("id", id)
      .maybeSingle()
    if (loadError || !data) {
      setError(loadError?.message || "Not found")
      return
    }
    setRow(data as Row)
    if (session?.user.id && id && session.user.id !== id) {
      await recordProfileView(supabase, { viewerId: session.user.id, studentId: id })
    }
  }, [id, session?.user.id])

  useEffect(() => {
    void load()
  }, [load])

  if (!row && !error) return <ActivityIndicator color={colors.navy} style={{ marginTop: 40 }} />
  if (!row) return <EmptyState title="Candidate unavailable" body={error || ""} />
  const person = one(row.profiles)

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>{person?.full_name || "Student"}</Text>
      <Text style={styles.meta}>{[row.degree, row.university, row.graduation_year].filter(Boolean).join(" · ")}</Text>
      {person?.bio ? <Text style={styles.body}>{person.bio}</Text> : null}
      {row.skills?.length ? <Text style={styles.skills}>{row.skills.join(" · ")}</Text> : null}
      <View style={{ gap: 8, marginTop: 8 }}>
        {row.linkedin_url ? <GhostButton label="LinkedIn" onPress={() => void Linking.openURL(row.linkedin_url!)} /> : null}
        {row.github_url ? <GhostButton label="GitHub" onPress={() => void Linking.openURL(row.github_url!)} /> : null}
        {row.portfolio_url ? <GhostButton label="Portfolio" onPress={() => void Linking.openURL(row.portfolio_url!)} /> : null}
      {person?.profile_video_url ? <MediaPlayer uri={person.profile_video_url} height={180} /> : null}
        {row.resume_url ? (
          <GhostButton
            label="Resume"
            onPress={() => {
              void (async () => {
                const href = await signedUrl("resumes", row.resume_url)
                if (href) await Linking.openURL(href)
              })()
            }}
          />
        ) : null}
      </View>
      {session?.user.id && id && session.user.id !== id ? (
        <ReportBlock currentUserId={session.user.id} peerId={id} peerName={person?.full_name} />
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  wrap: { padding: 20, gap: 10, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.8, color: colors.ink },
  meta: { fontSize: 15, color: colors.muted },
  body: { fontSize: 15, lineHeight: 22, color: colors.ink, marginTop: 8 },
  skills: { fontSize: 13, lineHeight: 20, color: colors.faint },
})
