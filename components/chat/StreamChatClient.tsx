"use client"

import { useEffect, useMemo, useState } from "react"
import { StreamChat } from "stream-chat"
import {
  Channel,
  ChannelHeader,
  Chat,
  LoadingIndicator,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react"
import "stream-chat-react/dist/css/v2/index.css"

type StreamChatClientProps = {
  conversationId: string
  currentUserId: string
  otherUserId: string
  title?: string | null
}

type TokenResponse = {
  token: string
  apiKey: string
  user: {
    id: string
    name: string
    image?: string
  }
}

export function StreamChatClient({
  conversationId,
  currentUserId,
  otherUserId,
  title,
}: StreamChatClientProps) {
  const [client, setClient] = useState<StreamChat | null>(null)
  const [activeChannel, setActiveChannel] = useState<ReturnType<StreamChat["channel"]> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const channelId = useMemo(() => `conversation-${conversationId}`, [conversationId])

  useEffect(() => {
    let disposed = false
    let mountedClient: StreamChat | null = null

    const init = async () => {
      try {
        const tokenRes = await fetch("/api/stream/token", { method: "POST" })
        const tokenData = (await tokenRes.json()) as TokenResponse | { error?: string }
        if (!tokenRes.ok || !("token" in tokenData) || !tokenData.token || !tokenData.apiKey) {
          throw new Error(("error" in tokenData && tokenData.error) || "Could not initialize chat.")
        }

        const chatClient = StreamChat.getInstance(tokenData.apiKey)
        mountedClient = chatClient
        await chatClient.connectUser(tokenData.user, tokenData.token)

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

        const ensured = chatClient.channel("messaging", channelId)
        await ensured.watch()

        if (!disposed) {
          setClient(chatClient)
          setActiveChannel(ensured)
        }
      } catch (e) {
        if (!disposed) {
          const message = e instanceof Error ? e.message : "Unable to load chat."
          setError(message)
        }
      }
    }

    void init()

    return () => {
      disposed = true
      if (mountedClient) {
        void mountedClient.disconnectUser()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, currentUserId, otherUserId, title, channelId])

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        {error}
      </div>
    )
  }

  if (!client || !activeChannel) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <LoadingIndicator />
      </div>
    )
  }

  const filters = { type: "messaging", members: { $in: [currentUserId] } }
  const sort = { last_message_at: -1 as const }

  return (
    <Chat client={client} theme="str-chat__theme-light">
      <div className="str-chat h-full">
        <div className="str-chat__container h-full">
          <Channel channel={activeChannel}>
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput focus />
            </Window>
            <Thread />
          </Channel>
        </div>
      </div>
    </Chat>
  )
}
