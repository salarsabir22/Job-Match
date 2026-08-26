"use client"

import { useMemo, useState } from "react"
import { ChannelList, Chat, useChatContext } from "stream-chat-react"
import { Search } from "lucide-react"
import type { Channel } from "stream-chat"
import "stream-chat-react/dist/css/v2/index.css"
import "@/components/chat/stream-chat.css"
import { useStreamClient } from "@/components/chat/useStreamClient"
import { ChatChannelPreview } from "@/components/chat/ChatChannelPreview"
import {
  ChatErrorState,
  ChatInboxEmpty,
  ChatLoadingState,
  ChatSelectPlaceholder,
} from "@/components/chat/ChatEmptyState"
import { ChatThreadPane } from "@/components/chat/ChatThreadPane"
import { channelJobTitle, getPeerUser, lastMessagePreview, useIsDesktop } from "@/components/chat/chat-helpers"
import { cn } from "@/lib/utils"

function InboxBody({ currentUserId }: { currentUserId: string }) {
  const { channel } = useChatContext("InboxBody")
  const isDesktop = useIsDesktop()
  const [query, setQuery] = useState("")

  const filters = useMemo(
    () => ({
      type: "messaging",
      members: { $in: [currentUserId] },
    }),
    [currentUserId]
  )

  const sort = useMemo(() => ({ last_message_at: -1 as const }), [])

  const channelRenderFilterFn = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return undefined
    return (channels: Channel[]) =>
      channels.filter((ch) => {
        const peer = getPeerUser(ch, currentUserId)
        const haystack = [
          peer?.name,
          channelJobTitle(ch),
          lastMessagePreview(ch.state.messages.at(-1), currentUserId),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        return haystack.includes(q)
      })
  }, [query, currentUserId])

  return (
    <div className={cn("jm-chat-inbox", channel && "jm-chat-inbox--open")}>
      <div className="jm-chat-inbox__list">
        <div className="shrink-0 bg-white px-4 pb-2 pt-3">
          <h1 className="text-[34px] font-bold leading-none tracking-tight text-black">Messages</h1>
          <label className="mt-3 flex items-center gap-2 rounded-[10px] bg-[#E5E5EA] px-2.5 py-1.5">
            <Search className="h-4 w-4 text-[#8E8E93]" strokeWidth={2.25} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-[17px] text-black outline-none placeholder:text-[#8E8E93]"
            />
          </label>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ChannelList
            filters={filters}
            sort={sort}
            options={{ state: true, watch: true, presence: true, limit: 30 }}
            showChannelSearch={false}
            setActiveChannelOnMount={isDesktop}
            Preview={ChatChannelPreview}
            EmptyStateIndicator={ChatInboxEmpty}
            channelRenderFilterFn={channelRenderFilterFn}
          />
        </div>
      </div>

      <div className="jm-chat-inbox__pane min-h-0">
        <ChatThreadPane emptyPlaceholder={<ChatSelectPlaceholder />} />
      </div>
    </div>
  )
}

export function StreamChatInboxClient({ currentUserId }: { currentUserId: string }) {
  const { client, error } = useStreamClient()

  if (error) return <ChatErrorState message={error} />
  if (!client) return <ChatLoadingState />

  return (
    <Chat client={client} theme="str-chat__theme-light">
      <div className="jm-chat str-chat h-full min-h-0">
        <InboxBody currentUserId={currentUserId} />
      </div>
    </Chat>
  )
}
