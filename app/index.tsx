import { Redirect } from "expo-router"
import { ActivityIndicator, View } from "react-native"
import { useSession } from "@/lib/session"
import { colors } from "@/lib/theme"

export default function Index() {
  const { ready, session, profile, studentReady, recruiterReady } = useSession()

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.ink }}>
        <ActivityIndicator color={colors.white} />
      </View>
    )
  }

  if (!session) return <Redirect href="/login" />

  const role = profile?.role
  if (role === "student" && !studentReady) return <Redirect href="/onboarding" />
  if (role === "recruiter" && !recruiterReady) return <Redirect href="/onboarding" />
  return <Redirect href="/discover" />
}
