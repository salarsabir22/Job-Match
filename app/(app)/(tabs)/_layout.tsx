import { useCallback, useEffect, useState } from "react"
import { Tabs } from "expo-router"
import { Text, type ColorValue } from "react-native"
import { useSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { loadUnreadCounts } from "@/lib/unread"
import { colors } from "@/lib/theme"

function TabMark({ label, color }: { label: string; color: ColorValue }) {
  return (
    <Text style={{ color, fontSize: 13, fontWeight: "700", letterSpacing: -0.3 }}>{label}</Text>
  )
}

export default function TabsLayout() {
  const { profile, session } = useSession()
  const recruiter = profile?.role === "recruiter"
  const userId = session?.user.id
  const [unread, setUnread] = useState({ chat: 0, pings: 0 })

  const refresh = useCallback(async () => {
    if (!userId) return
    setUnread(await loadUnreadCounts(supabase, userId))
  }, [userId])

  useEffect(() => {
    void refresh()
    if (!userId) return
    const channel = supabase
      .channel(`tab-unread:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => void refresh())
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [refresh, userId])

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: "rgba(0,0,0,0.38)",
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.line,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => <TabMark label="D" color={color} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          href: recruiter ? null : undefined,
          tabBarIcon: ({ color }) => <TabMark label="F" color={color} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Jobs",
          href: recruiter ? undefined : null,
          tabBarIcon: ({ color }) => <TabMark label="J" color={color} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: recruiter ? "Pipeline" : "Apps",
          tabBarIcon: ({ color }) => <TabMark label="A" color={color} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Chat",
          tabBarBadge: unread.chat > 0 ? unread.chat : undefined,
          tabBarIcon: ({ color }) => <TabMark label="C" color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarBadge: unread.pings > 0 ? unread.pings : undefined,
          tabBarIcon: ({ color }) => <TabMark label="M" color={color} />,
        }}
      />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  )
}
