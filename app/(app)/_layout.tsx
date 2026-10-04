import { Redirect, Stack } from "expo-router"
import { ActivityIndicator, View } from "react-native"
import { useSession } from "@/lib/session"
import { PushBridge } from "@/components/PushBridge"
import { colors } from "@/lib/theme"

const stackHeader = {
  headerShown: true as const,
  headerTintColor: colors.ink,
  headerTitleStyle: { fontWeight: "600" as const },
  headerShadowVisible: false,
  headerStyle: { backgroundColor: colors.bg },
}

export default function AppGroupLayout() {
  const { ready, session, profile, studentReady, recruiterReady } = useSession()

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.navy} />
      </View>
    )
  }
  if (!session) return <Redirect href="/login" />
  if (profile?.role === "student" && !studentReady) return <Redirect href="/onboarding" />
  if (profile?.role === "recruiter" && !recruiterReady) return <Redirect href="/onboarding" />

  return (
    <>
      <PushBridge />
      <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat/[id]" options={{ ...stackHeader, title: "Chat" }} />
      <Stack.Screen name="job/new" options={{ ...stackHeader, title: "Post a job" }} />
      <Stack.Screen name="job/[id]/index" options={{ ...stackHeader, title: "Role" }} />
      <Stack.Screen name="job/[id]/edit" options={{ ...stackHeader, title: "Edit job" }} />
      <Stack.Screen name="candidate/[id]" options={{ ...stackHeader, title: "Candidate" }} />
      <Stack.Screen name="company/[id]" options={{ ...stackHeader, title: "Company" }} />
      <Stack.Screen name="community/index" options={{ ...stackHeader, title: "Community" }} />
      <Stack.Screen name="community/[id]" options={{ ...stackHeader, title: "Channel" }} />
      <Stack.Screen name="dashboard" options={{ ...stackHeader, title: "Insights" }} />
      <Stack.Screen name="notifications" options={{ ...stackHeader, title: "Pings" }} />
      <Stack.Screen name="saved" options={{ ...stackHeader, title: "Saved" }} />
      <Stack.Screen name="feedback" options={{ ...stackHeader, title: "Feedback" }} />
      <Stack.Screen name="profile-edit" options={{ ...stackHeader, title: "Edit profile" }} />
      <Stack.Screen name="admin/index" options={{ ...stackHeader, title: "Admin" }} />
      <Stack.Screen name="admin/users" options={{ ...stackHeader, title: "Users" }} />
      <Stack.Screen name="admin/recruiters" options={{ ...stackHeader, title: "Recruiters" }} />
      <Stack.Screen name="admin/channels" options={{ ...stackHeader, title: "Channels" }} />
      <Stack.Screen name="admin/reports" options={{ ...stackHeader, title: "Reports" }} />
    </Stack>
    </>
  )
}
