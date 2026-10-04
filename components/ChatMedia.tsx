import { useEffect, useState } from "react"
import { Image, Linking, Pressable, StyleSheet, Text } from "react-native"
import { signedUrl } from "@/lib/upload"
import { classifyChatMedia, isGenericCaption } from "@/lib/chat-media"
import { VoiceBubble } from "@/components/VoiceBubble"
import { MediaPlayer } from "@/components/MediaPlayer"
import { colors } from "@/lib/theme"

export function ChatMedia({
  messageType,
  src,
  content,
  fileName,
  mimeType,
  durationSeconds,
  own,
}: {
  messageType?: string | null
  src: string
  content?: string | null
  fileName?: string | null
  mimeType?: string | null
  durationSeconds?: number | null
  own?: boolean
}) {
  const kind = classifyChatMedia({ messageType, mimeType, fileName, content })
  const [uri, setUri] = useState<string | null>(src.startsWith("http") || src.startsWith("file:") ? src : null)

  useEffect(() => {
    if (src.startsWith("http") || src.startsWith("file:")) {
      setUri(src)
      return
    }
    void signedUrl("chat-media", src).then(setUri)
  }, [src])

  if (kind === "voice") {
    return <VoiceBubble src={src} durationSeconds={durationSeconds ?? 1} own={own} />
  }
  if (kind === "image") {
    return uri ? <Image source={{ uri }} style={styles.photo} /> : null
  }
  if (kind === "video") {
    return uri ? <MediaPlayer uri={uri} height={180} /> : null
  }
  if (kind === "audio") {
    return uri ? <VoiceBubble src={uri} durationSeconds={durationSeconds ?? 1} own={own} /> : null
  }
  const title = fileName || content || "File"
  return (
    <Pressable
      onPress={() => {
        if (uri) void Linking.openURL(uri)
      }}
      style={[styles.file, own && { backgroundColor: "rgba(255,255,255,0.12)" }]}
    >
      <Text style={[styles.fileName, own && { color: colors.white }]} numberOfLines={2}>
        {title}
      </Text>
      <Text style={[styles.fileMeta, own && { color: "rgba(255,255,255,0.7)" }]}>Open file</Text>
    </Pressable>
  )
}

export function Caption({ content, own }: { content?: string | null; own?: boolean }) {
  if (isGenericCaption(content)) return null
  return <Text style={[styles.caption, own && { color: colors.white }]}>{content}</Text>
}

const styles = StyleSheet.create({
  photo: { width: 180, height: 140, borderRadius: 10, marginBottom: 6, backgroundColor: colors.line },
  file: {
    minWidth: 160,
    borderRadius: 12,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.04)",
    marginBottom: 6,
  },
  fileName: { fontSize: 13, fontWeight: "600", color: colors.ink },
  fileMeta: { marginTop: 4, fontSize: 11, color: colors.muted },
  caption: { fontSize: 15, lineHeight: 20, color: colors.ink },
})
