"use client"

import { ChatThread } from "@/components/chat/ChatThread"
import type { ChatPeer } from "@/lib/chat/inbox"

export function MatchChatClient({
  conversationId,
  currentUserId,
  peer,
  jobTitle,
}: {
  conversationId: string
  currentUserId: string
  peer: ChatPeer
  jobTitle?: string | null
}) {
  return (
    <ChatThread
      conversationId={conversationId}
      currentUserId={currentUserId}
      peer={peer}
      jobTitle={jobTitle}
      backHref="/chat"
    />
  )
}
