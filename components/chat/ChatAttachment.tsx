"use client"

import { Attachment } from "stream-chat-react"
import type { AttachmentProps } from "stream-chat-react"
import { ChatVoiceRecording } from "@/components/chat/ChatVoiceRecording"

export function ChatAttachment(props: AttachmentProps) {
  return <Attachment {...props} VoiceRecording={ChatVoiceRecording} />
}
