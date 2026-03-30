"use client"

import { useEffect, useMemo, useState } from "react"
import { StreamChat } from "stream-chat"
import {
  Channel,
  ChannelHeader,
  ChannelList,
  Chat,
  LoadingIndicator,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react"
import "stream-chat-react/dist/css/v2/index.css"

type TokenResponse = {
  token: string
  apiKey: string
  user: { id: string; name: string; image?: string }
}

export function StreamChatInboxClient({ currentUserId }: { currentUserId: string }) {
  const [client, setClient] = useState<StreamChat | null>(null)
  const [error, setError] = useState<string | null>(null)

  const channelFilters = useMemo(
    () => ({
      type: "messaging",
      members: { $in: [currentUserId] },
    }),
    [currentUserId]
  )

  const sort = useMemo(() => ({ last_message_at: -1 }), [])

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const tokenRes = await fetch("/api/stream/token", { method: "POST" })
        const tokenData = (await tokenRes.json()) as TokenResponse | { error?: string }
        if (!tokenRes.ok || !("token" in tokenData) || !tokenData.token) {
          throw new Error("Could not initialize chat.")
        }

        const chatClient = StreamChat.getInstance(tokenData.apiKey)
        await chatClient.connectUser(tokenData.user, tokenData.token)

        if (mounted) setClient(chatClient)
      } catch (e) {
        if (!mounted) return
        const message = e instanceof Error ? e.message : "Unable to load chat."
        setError(message)
      }
    }

    void init()

    return () => {
      mounted = false
      if (client) {
        void client.disconnectUser()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId])

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        {error}
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <LoadingIndicator />
      </div>
    )
  }

  return (
    <Chat client={client} theme="str-chat__theme-light">
      <div className="str-chat h-full">
        <div className="str-chat__container h-full">
          <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="flex min-h-0 flex-col border-b border-border bg-card lg:border-b-0 lg:border-r">
              <ChannelList
                filters={channelFilters}
                sort={sort}
                options={{ state: true, watch: true, presence: true, limit: 20 }}
                showChannelSearch={false}
              />
            </div>

            <div className="min-h-0 flex flex-col">
              <Channel>
                <Window>
                  <ChannelHeader />
                  <MessageList />
                  <MessageInput focus />
                </Window>
                <Thread />
              </Channel>
            </div>
          </div>
        </div>
      </div>
    </Chat>
  )
}

