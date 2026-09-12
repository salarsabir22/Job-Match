"use client"

import { BellOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChatUserAvatar } from "@/components/chat/ChatUserAvatar"
import { formatPreviewTime } from "@/components/chat/chat-helpers"
import { previewText, type InboxConversation } from "@/lib/chat/inbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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
    ? previewText(
        conversation.lastMessage.content,
        conversation.lastMessage.sender_id,
        currentUserId,
        conversation.lastMessage.message_type
      )
    : "No messages yet"
  const time = formatPreviewTime(conversation.lastMessage?.created_at)
  const hasUnread = conversation.unreadCount > 0

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onSelect}
      className={cn(
        "mx-2 mb-1 h-auto w-[calc(100%-1rem)] items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-left",
        active ? "bg-primary/12 ring-1 ring-primary/25" : "hover:bg-muted/70"
      )}
    >
      <ChatUserAvatar name={name} image={conversation.peer.avatar_url} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p
            className={cn(
              "truncate font-heading text-[14px] tracking-tight text-foreground",
              hasUnread ? "font-semibold" : "font-medium"
            )}
          >
            {name}
          </p>
          <span className="ml-auto shrink-0 font-data text-[10px] text-muted-foreground">{time}</span>
        </div>
        {conversation.jobTitle ? (
          <p className="truncate font-data text-[10px] uppercase tracking-[0.12em] text-primary/80">
            {conversation.jobTitle}
          </p>
        ) : null}
        <p
          className={cn(
            "mt-0.5 truncate font-body text-[13px]",
            hasUnread ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {preview}
        </p>
      </div>
      {conversation.muted ? (
        <BellOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="Muted" />
      ) : hasUnread ? (
        <Badge className="h-5 min-w-5 justify-center px-1.5">
          {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
        </Badge>
      ) : null}
    </Button>
  )
}
