"use client"

import type { ChannelPreviewUIComponentProps } from "stream-chat-react"
import { useChatContext } from "stream-chat-react"
import { cn } from "@/lib/utils"
import { ChatUserAvatar } from "@/components/chat/ChatUserAvatar"
import {
  formatPreviewTime,
  getPeerUser,
  lastMessagePreview,
} from "@/components/chat/chat-helpers"

export function ChatChannelPreview({
  channel,
  active,
  displayTitle,
  displayImage,
  lastMessage,
  unread = 0,
  setActiveChannel,
  watchers,
}: ChannelPreviewUIComponentProps) {
  const { client } = useChatContext("ChatChannelPreview")
  const currentUserId = client.userID || ""
  const peer = getPeerUser(channel, currentUserId)
  const name = peer?.name || displayTitle || "Match"
  const image = peer?.image || displayImage
  const preview = lastMessagePreview(lastMessage, currentUserId)
  const time = formatPreviewTime(lastMessage?.created_at)
  const hasUnread = unread > 0

  return (
    <button
      type="button"
      onClick={() => setActiveChannel?.(channel, watchers)}
      className={cn(
        "flex w-full items-center gap-0 text-left",
        active ? "bg-[#D1D1D6]/55" : "bg-white hover:bg-[#F2F2F7]"
      )}
    >
      <div className="flex w-6 shrink-0 items-center justify-center">
        {hasUnread ? <span className="h-[9px] w-[9px] rounded-full bg-[#007AFF]" /> : null}
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-3 border-b border-black/[0.08] py-2.5 pr-4">
        <ChatUserAvatar name={name} image={image} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p
              className={cn(
                "truncate text-[17px] tracking-tight text-black",
                hasUnread ? "font-semibold" : "font-medium"
              )}
            >
              {name}
            </p>
            <span className="ml-auto shrink-0 text-[14px] text-[#8E8E93]">{time}</span>
          </div>
          <p
            className={cn(
              "mt-0.5 truncate text-[15px] leading-snug",
              hasUnread ? "font-medium text-black" : "text-[#8E8E93]"
            )}
          >
            {preview}
          </p>
        </div>
      </div>
    </button>
  )
}
