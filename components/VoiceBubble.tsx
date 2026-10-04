import { useEffect, useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio"
import { signedUrl } from "@/lib/upload"
import { formatVoiceClock, voiceBars } from "@/lib/voice"
import { colors } from "@/lib/theme"

export function VoiceBubble({
  src,
  durationSeconds,
  own,
}: {
  src: string
  durationSeconds: number
  own?: boolean
}) {
  const [uri, setUri] = useState<string | null>(
    src.startsWith("http") || src.startsWith("file:") ? src : null
  )

  useEffect(() => {
    if (src.startsWith("http") || src.startsWith("file:")) {
      setUri(src)
      return
    }
    void signedUrl("chat-media", src).then((next) => setUri(next))
  }, [src])

  if (!uri) {
    return <Text style={[styles.clock, own && styles.clockOwn]}>{formatVoiceClock(durationSeconds)}</Text>
  }
  return <VoicePlayer uri={uri} durationSeconds={durationSeconds} own={own} />
}

function VoicePlayer({
  uri,
  durationSeconds,
  own,
}: {
  uri: string
  durationSeconds: number
  own?: boolean
}) {
  const player = useAudioPlayer(uri, { updateInterval: 200 })
  const status = useAudioPlayerStatus(player)
  const bars = useMemo(() => voiceBars(uri), [uri])
  const duration = status.duration > 0 ? status.duration : durationSeconds || 1
  const progress = Math.min(1, (status.currentTime || 0) / duration)
  const shown = status.playing || (status.currentTime || 0) > 0.15 ? status.currentTime : durationSeconds

  const toggle = () => {
    if (status.playing) {
      player.pause()
      return
    }
    if ((status.currentTime || 0) >= duration - 0.05) {
      player.seekTo(0)
    }
    player.play()
  }

  return (
    <View style={styles.row}>
      <Pressable onPress={toggle} style={[styles.play, own ? styles.playOwn : styles.playPeer]}>
        <Text style={[styles.playLabel, own && { color: colors.navy }]}>{status.playing ? "Pause" : "Play"}</Text>
      </Pressable>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.wave}>
          {bars.map((h, i) => {
            const played = i / bars.length <= progress
            return (
              <View
                key={i}
                style={[
                  styles.bar,
                  { height: Math.max(4, Math.round(h * 22)) },
                  own
                    ? { backgroundColor: played ? colors.white : "rgba(255,255,255,0.35)" }
                    : { backgroundColor: played ? colors.navy : "rgba(30,58,95,0.28)" },
                ]}
              />
            )
          })}
        </View>
        <Text style={[styles.clock, own && styles.clockOwn]}>{formatVoiceClock(shown)}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, minWidth: 180 },
  play: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  playOwn: { backgroundColor: "rgba(255,255,255,0.2)" },
  playPeer: { backgroundColor: colors.navy },
  playLabel: { fontSize: 12, fontWeight: "700", color: colors.white },
  wave: { height: 24, flexDirection: "row", alignItems: "center", gap: 1 },
  bar: { width: 2, borderRadius: 1 },
  clock: { marginTop: 4, fontSize: 11, color: colors.muted, fontVariant: ["tabular-nums"] },
  clockOwn: { color: "rgba(255,255,255,0.7)" },
})
