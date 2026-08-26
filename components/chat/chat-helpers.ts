import { useEffect, useState } from "react"
import type { Channel, LocalMessage, UserResponse } from "stream-chat"

export function useIsDesktop(query = "(min-width: 1024px)") {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(query)
    const update = () => setMatches(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [query])

  return matches
}

export function getPeerUser(channel: Channel, currentUserId: string): UserResponse | undefined {
  const members = Object.values(channel.state.members ?? {})
  const peer = members.find((m) => (m.user_id || m.user?.id) !== currentUserId)
  return peer?.user
}

export function channelJobTitle(channel: Channel): string | undefined {
  const data = channel.data as { name?: string } | undefined
  const name = data?.name?.trim()
  if (!name || name === "Match chat") return undefined
  return name
}

export function formatPreviewTime(date?: string | Date | null) {
  if (!date) return ""
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ""

  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday"

  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString(undefined, { month: "numeric", day: "numeric" })
  }

  return d.toLocaleDateString(undefined, { month: "numeric", day: "numeric", year: "2-digit" })
}

export function formatDaySeparator(date: Date) {
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  const now = new Date()

  if (date.toDateString() === now.toDateString()) return `Today ${time}`

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`

  const day = date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
  return `${day} at ${time}`
}

export function lastMessagePreview(message?: LocalMessage, currentUserId?: string) {
  if (!message) return "No messages yet"

  const attachments = message.attachments ?? []
  let body = ""
  if (attachments.some((a) => a.type === "voiceRecording" || a.type === "audio")) {
    body = "Voice Message"
  } else if (attachments.some((a) => a.type === "image" || a.type === "thumb" || Boolean(a.image_url))) {
    body = message.text?.trim() || "Photo"
  } else if (attachments.some((a) => a.type === "file" || a.type === "video")) {
    body = message.text?.trim() || "Attachment"
  } else {
    body = message.text?.trim() || (attachments.length ? "Attachment" : " ")
  }

  if (currentUserId && message.user?.id === currentUserId && body.trim()) {
    return `You: ${body}`
  }
  return body
}

export const ICEBREAKERS = [
  "Hi - thanks for matching. I’d love to learn more.",
  "Hey! Is this still open to chat about?",
  "Hello - happy to share more about my background.",
]
