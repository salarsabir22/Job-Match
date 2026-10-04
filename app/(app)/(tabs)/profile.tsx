import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { recruiterCompleteness, studentCompleteness } from "@/lib/completeness"
import { GhostButton, PageHeader, PrimaryButton, Screen } from "@/components/ui"
import { MediaPlayer } from "@/components/MediaPlayer"
import { colors } from "@/lib/theme"

export default function ProfileScreen() {
  const router = useRouter()
  const { profile, session, signOut } = useSession()
  const recruiter = profile?.role === "recruiter"
  const userId = session!.user.id
  const [headline, setHeadline] = useState("")
  const [stats, setStats] = useState<{ label: string; value: string }[]>([])
  const [complete, setComplete] = useState<{ percent: number; items: { id: string; label: string; done: boolean }[] } | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (recruiter) {
      const { data } = await supabase
        .from("recruiter_profiles")
        .select("company_name, industry, hiring_focus, description, website_url, logo_url")
        .eq("id", userId)
        .maybeSingle()
      setHeadline([data?.company_name, data?.industry || data?.hiring_focus].filter(Boolean).join(" · "))
      setComplete(
        recruiterCompleteness({
          logo: data?.logo_url,
          description: data?.description,
          website: data?.website_url,
          industry: data?.industry,
          video: profile?.profile_video_url,
        })
      )
      const [{ count: matches }, { count: jobs }, { count: posts }] = await Promise.all([
        supabase.from("matches").select("id", { count: "exact", head: true }).eq("recruiter_id", userId),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("recruiter_id", userId),
        supabase.from("feed_posts").select("id", { count: "exact", head: true }).eq("author_id", userId),
      ])
      setStats([
        { label: "Matches", value: String(matches ?? 0) },
        { label: "Jobs", value: String(jobs ?? 0) },
        { label: "Posts", value: String(posts ?? 0) },
      ])
    } else {
      const { data } = await supabase
        .from("student_profiles")
        .select("university, degree, graduation_year, skills, linkedin_url, resume_url")
        .eq("id", userId)
        .maybeSingle()
      setHeadline([data?.degree, data?.university, data?.graduation_year].filter(Boolean).join(" · "))
      setComplete(
        studentCompleteness({
          avatar: profile?.avatar_url,
          bio: profile?.bio,
          university: data?.university,
          skills: data?.skills,
          resume: data?.resume_url,
          video: profile?.profile_video_url,
          linkedin: data?.linkedin_url,
        })
      )
      const [{ count: matches }, { count: applied }, { count: posts }] = await Promise.all([
        supabase.from("matches").select("id", { count: "exact", head: true }).eq("student_id", userId),
        supabase.from("job_swipes").select("id", { count: "exact", head: true }).eq("student_id", userId).eq("direction", "right"),
        supabase.from("feed_posts").select("id", { count: "exact", head: true }).eq("author_id", userId),
      ])
      setStats([
        { label: "Matches", value: String(matches ?? 0) },
        { label: "Interested", value: String(applied ?? 0) },
        { label: "Posts", value: String(posts ?? 0) },
      ])
    }
    setLoading(false)
  }, [recruiter, userId, profile?.avatar_url, profile?.bio, profile?.profile_video_url])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <PageHeader kicker="Profile" title={profile?.full_name || "You"} />
        <ScrollView contentContainerStyle={styles.body}>
          {profile?.cover_url ? <Image source={{ uri: profile.cover_url }} style={styles.cover} /> : null}
          {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.avatar} /> : null}
          <Text style={styles.meta}>
            {(profile?.role || "member").replace(/_/g, " ")}
            {session?.user.email ? ` · ${session.user.email}` : ""}
          </Text>
          {headline ? <Text style={styles.headline}>{headline}</Text> : null}
          {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          {profile?.profile_video_url ? <MediaPlayer uri={profile.profile_video_url} height={180} /> : null}
          {complete ? (
            <View style={styles.complete}>
              <Text style={styles.headline}>{complete.percent}% complete</Text>
              {complete.items.map((item) => (
                <Text key={item.id} style={styles.item}>
                  {item.done ? "●" : "○"} {item.label}
                </Text>
              ))}
            </View>
          ) : null}
          {loading ? (
            <ActivityIndicator color={colors.navy} style={{ marginTop: 16 }} />
          ) : (
            <View style={styles.stats}>
              {stats.map((s) => (
                <View key={s.label} style={styles.stat}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          )}
          <PrimaryButton label="Edit profile" onPress={() => router.push("/profile-edit")} />
          {!recruiter ? <GhostButton label="Saved roles" onPress={() => router.push("/saved")} /> : null}
          {recruiter ? <GhostButton label="Company page" onPress={() => router.push(`/company/${userId}`)} /> : null}
          <GhostButton
            label="Sign out"
            onPress={async () => {
              await signOut()
              router.replace("/login")
            }}
          />
        </ScrollView>
      </SafeAreaView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 22, paddingBottom: 40, gap: 12 },
  meta: {
    fontSize: 14,
    color: colors.muted,
    textTransform: "capitalize",
  },
  headline: { fontSize: 15, color: colors.navy, fontWeight: "600" },
  bio: { fontSize: 15, lineHeight: 22, color: colors.ink },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.line },
  cover: { width: "100%", height: 120, borderRadius: 16, backgroundColor: colors.line },
  complete: { gap: 4, paddingVertical: 8 },
  item: { fontSize: 13, color: colors.muted },
  stats: { flexDirection: "row", gap: 8, marginVertical: 8 },
  stat: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
  },
  statValue: { fontSize: 22, fontWeight: "700", color: colors.ink, letterSpacing: -0.6 },
  statLabel: { marginTop: 4, fontSize: 12, color: colors.muted },
})
