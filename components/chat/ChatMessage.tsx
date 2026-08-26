"use client"

import { cn } from "@/lib/utils"
import {
  MessageOptions,
  ReactionsList,
  renderText,
  useChatContext,
  useMessageContext,
} from "stream-chat-react"
import { ChatAttachment } from "@/components/chat/ChatAttachment"

export function ChatMessage() {
  const { client } = useChatContext("ChatMessage")
  const {
    message,
    isMyMessage,
    handleRetry,
    groupStyles,
    readBy,
    lastOwnMessage,
  } = useMessageContext("ChatMessage")

  const mine = isMyMessage()
  const group = groupStyles?.[0] || "single"
  const isLastInGroup = group === "bottom" || group === "single"
  const isLatestOwn = Boolean(mine && lastOwnMessage?.id && lastOwnMessage.id === message.id)
  const sending = message.status === "sending" || message.status === "pending"
  const failed = message.status === "failed"
  const othersRead = (readBy ?? []).some((u) => u.id && u.id !== client.userID)

  const bubbleRadius = mine
    ? cn(
        "rounded-[18px]",
        (group === "single" || group === "bottom") && "rounded-br-[4px]",
        group === "top" && "rounded-br-[6px]",
        group === "middle" && "rounded-r-[6px]"
      )
    : cn(
        "rounded-[18px]",
        (group === "single" || group === "bottom") && "rounded-bl-[4px]",
        group === "top" && "rounded-bl-[6px]",
        group === "middle" && "rounded-l-[6px]"
      )

  const quoted = message.quoted_message
  const hasAttachments = Boolean(message.attachments?.length)

  const receipt = sending ? "Sending…" : othersRead ? "Read" : "Delivered"

  return (
    <div
      className={cn(
        "group relative flex px-2",
        mine ? "justify-end" : "justify-start",
        isLastInGroup ? "mb-2" : "mb-[2px]"
      )}
    >
      <div className={cn("flex max-w-[75%] flex-col sm:max-w-[62%]", mine ? "items-end" : "items-start")}>
        <div className="relative">
          <div
            className={cn(
              "px-[14px] py-[7px] text-[17px] leading-[22px] tracking-[-0.01em]",
              bubbleRadius,
              mine ? "bg-[#007AFF] text-white" : "bg-[#E9E9EB] text-black",
              sending && "opacity-80",
              failed && "outline outline-1 outline-red-400"
            )}
          >
            {quoted && typeof quoted === "object" && "text" in quoted ? (
              <div
                className={cn(
                  "mb-1 border-l-2 pl-2 text-[13px] leading-snug opacity-80",
                  mine ? "border-white/50" : "border-black/25"
                )}
              >
                <p className="font-semibold">{quoted.user?.name || "Message"}</p>
                <p className="line-clamp-2">{quoted.text || "Attachment"}</p>
              </div>
            ) : null}

            {hasAttachments ? (
              <div className="mb-1 max-w-full overflow-hidden">
                <ChatAttachment attachments={message.attachments ?? []} />
              </div>
            ) : null}

            {message.text ? (
              <div className="[&_a]:underline [&_p]:m-0 [&_p]:break-words">
                {renderText(message.text, message.mentioned_users)}
              </div>
            ) : null}
          </div>

          <div
            className={cn(
              "absolute top-1/2 z-10 -translate-y-1/2 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100",
              mine ? "right-full mr-1" : "left-full ml-1"
            )}
          >
            <MessageOptions />
          </div>
        </div>

        {message.reaction_groups && Object.keys(message.reaction_groups).length > 0 ? (
          <div className="-mt-1">
            <ReactionsList />
          </div>
        ) : null}

        {failed ? (
          <button
            type="button"
            onClick={() => void handleRetry(message)}
            className="mt-1 text-[11px] text-[#FF3B30]"
          >
            Not Delivered. Tap to Retry
          </button>
        ) : isLatestOwn ? (
          <p className="mt-[3px] pr-1 text-[11px] leading-none text-[#8E8E93]">{receipt}</p>
        ) : null}
      </div>
    </div>
  )
}
