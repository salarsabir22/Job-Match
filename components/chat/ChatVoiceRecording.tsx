"use client"

import { useMessageContext } from "stream-chat-react"
import type { VoiceRecordingProps } from "stream-chat-react"
import { VoiceMessagePlayer } from "@/components/chat/VoiceMessagePlayer"

export function ChatVoiceRecording({ attachment, isQuoted }: VoiceRecordingProps) {
  const { isMyMessage } = useMessageContext()
  const src = attachment.asset_url || attachment.thumb_url || ""
  const duration = Number(attachment.duration ?? 0)

  if (!src) return null

  return (
    <VoiceMessagePlayer
      src={src}
      durationSec={duration}
      isOwn={!isQuoted && isMyMessage()}
    />
  )
}
