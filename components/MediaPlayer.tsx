import { useVideoPlayer, VideoView } from "expo-video"
import { StyleSheet } from "react-native"

export function MediaPlayer({ uri, height = 200 }: { uri: string; height?: number }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false
  })
  return <VideoView player={player} style={[styles.video, { height }]} nativeControls contentFit="contain" />
}

const styles = StyleSheet.create({
  video: { width: "100%", borderRadius: 12, backgroundColor: "#000" },
})
