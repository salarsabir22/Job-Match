import { Pressable, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useSession } from "@/lib/session"
import { PageHeader, Screen } from "@/components/ui"
import { colors } from "@/lib/theme"

export default function MoreScreen() {
  const router = useRouter()
  const { profile, signOut } = useSession()
  const recruiter = profile?.role === "recruiter"

  const links = [
    { label: "Profile", href: "/profile" },
    { label: "Edit profile", href: "/profile-edit" },
    { label: "Insights", href: "/dashboard" },
    { label: "Pings", href: "/notifications" },
    { label: "Community", href: "/community" },
    ...(profile?.role === "admin" ? [{ label: "Admin", href: "/admin" }] : []),
    ...(recruiter
      ? [
          { label: "Feed", href: "/feed" },
          { label: "Post a job", href: "/job/new" },
        ]
      : [{ label: "Saved roles", href: "/saved" }]),
    { label: "Feedback", href: "/feedback" },
  ]

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <PageHeader kicker="Menu" title={profile?.full_name || "More"} />
        <Text style={styles.role}>{(profile?.role || "member").replace(/_/g, " ")}</Text>
        <View style={{ paddingHorizontal: 22, gap: 8, marginTop: 8 }}>
          {links.map((item) => (
            <Pressable key={item.href} onPress={() => router.push(item.href as never)} style={styles.row}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={async () => {
              await signOut()
              router.replace("/login")
            }}
            style={[styles.row, { marginTop: 12 }]}
          >
            <Text style={[styles.rowLabel, { color: colors.danger }]}>Sign out</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  role: {
    paddingHorizontal: 22,
    marginBottom: 10,
    fontSize: 14,
    color: colors.muted,
    textTransform: "capitalize",
  },
  row: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
    color: colors.ink,
  },
  chev: {
    fontSize: 22,
    color: colors.faint,
  },
})
