"use client"

import { useEffect, useMemo, useState } from "react"
import { Chat } from "stream-chat-react"
import type { Channel as StreamChannel } from "stream-chat"
import "stream-chat-react/dist/css/v2/index.css"
import "@/components/chat/stream-chat.css"
import { useStreamClient } from "@/components/chat/useStreamClient"
import { ChatErrorState, ChatLoadingState } from "@/components/chat/ChatEmptyState"
import { ChatThreadPane } from "@/components/chat/ChatThreadPane"

type StreamChatClientProps = {
  conversationId: string
  currentUserId: string
  otherUserId: string
  title?: string | null
}

export function StreamChatClient({
  conversationId,
  currentUserId,
  otherUserId,
  title,
}: StreamChatClientProps) {
  const { client, error } = useStreamClient()
  const [activeChannel, setActiveChannel] = useState<StreamChannel | null>(null)
  const [channelError, setChannelError] = useState<string | null>(null)

  const channelId = useMemo(() => `conversation-${conversationId}`, [conversationId])

  useEffect(() => {
    if (!client) return
    let disposed = false

    const open = async () => {
      try {
        const ensureRes = await fetch("/api/stream/channel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            memberIds: [currentUserId, otherUserId],
            name: title || "Match chat",
          }),
        })
        if (!ensureRes.ok) {
          const body = (await ensureRes.json().catch(() => ({}))) as { error?: string }
          throw new Error(body.error || "Could not open channel.")
        }

        const ensured = client.channel("messaging", channelId)
        await ensured.watch()
        if (!disposed) setActiveChannel(ensured)
      } catch (e) {
        if (!disposed) {
          setChannelError(e instanceof Error ? e.message : "Unable to load chat.")
        }
      }
    }

    void open()
    return () => {
      disposed = true
    }
  }, [client, conversationId, currentUserId, otherUserId, title, channelId])

  if (error || channelError) return <ChatErrorState message={error || channelError || "Unable to load chat."} />
  if (!client || !activeChannel) return <ChatLoadingState />

  return (
    <Chat client={client} theme="str-chat__theme-light">
      <div className="jm-chat str-chat h-full min-h-0">
        <ChatThreadPane channel={activeChannel} backHref="/chat" subtitle={title} />
      </div>
    </Chat>
  )
}
