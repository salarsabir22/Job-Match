"use client"

import { cn } from "@/lib/utils"
import { ChatUserAvatar } from "@/components/chat/ChatUserAvatar"
import { formatPreviewTime } from "@/components/chat/chat-helpers"
import { previewText, type InboxConversation } from "@/lib/chat/inbox"

export function ChatChannelPreview({
  conversation,
  currentUserId,
  active,
  onSelect,
}: {
  conversation: InboxConversation
  currentUserId: string
  active: boolean
  onSelect: () => void
}) {
  const name = conversation.peer.full_name || "Match"
  const preview = conversation.lastMessage
    ? previewText(conversation.lastMessage.content, conversation.lastMessage.sender_id, currentUserId)
    : "No messages yet"
  const time = formatPreviewTime(conversation.lastMessage?.created_at)
  const hasUnread = conversation.unreadCount > 0

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-0 text-left",
        active ? "bg-[#D1D1D6]/55" : "bg-white hover:bg-[#F2F2F7]"
      )}
    >
      <div className="flex w-6 shrink-0 items-center justify-center">
        {hasUnread ? <span className="h-[9px] w-[9px] rounded-full bg-[#007AFF]" /> : null}
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-3 border-b border-black/[0.08] py-2.5 pr-4">
        <ChatUserAvatar name={name} image={conversation.peer.avatar_url} size="lg" />
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
