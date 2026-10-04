import { useCallback, useEffect, useState } from "react"
import { StyleSheet, Text } from "react-native"
import { GhostButton } from "@/components/ui"
import { enablePush, getPushEnabled, pushAvailable } from "@/lib/push"
import { colors } from "@/lib/theme"

export function PushOptIn() {
  const [status, setStatus] = useState<"idle" | "on" | "blocked">("idle")

  const refresh = useCallback(async () => {
    setStatus((await getPushEnabled()) ? "on" : "idle")
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  if (!pushAvailable) {
    return <Text style={styles.on}>Pings need a development build on Android. Expo Go can’t show them.</Text>
  }

  if (status === "on") {
    return <Text style={styles.on}>Pings are on. We’ll nudge you when something lands.</Text>
  }

  return (
    <GhostButton
      label="Turn on pings"
      onPress={() => {
        void (async () => {
          const ok = await enablePush()
          setStatus(ok ? "on" : "blocked")
        })()
      }}
    />
  )
}

const styles = StyleSheet.create({
  on: { fontSize: 13, lineHeight: 18, color: colors.muted },
})
