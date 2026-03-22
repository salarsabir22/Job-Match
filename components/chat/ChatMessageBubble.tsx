"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import type { ChatPayload } from "@/lib/chat-message"
import { VoiceMessagePlayer } from "@/components/chat/VoiceMessagePlayer"
import { MessageTicks, messageTimeLabel, type MessageDeliveryStatus } from "@/components/chat/MessageTicks"

type ChatMessageBubbleProps = {
  payload: ChatPayload
  isOwn: boolean
  createdAt: string
  /** Only for own messages */
  deliveryStatus?: MessageDeliveryStatus
}

export function ChatMessageBubble({ payload, isOwn, createdAt, deliveryStatus }: ChatMessageBubbleProps) {
  const time = messageTimeLabel(createdAt)
  const showTicks = Boolean(isOwn && deliveryStatus)

  const footer = (
    <div
      className={cn(
        "flex items-center justify-end gap-1.5 mt-1 pt-0.5 select-none",
        isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
      )}
    >
      <span className="font-data text-[10px] tabular-nums leading-none">{time}</span>
      {showTicks && deliveryStatus ? (
        <MessageTicks status={deliveryStatus} onPrimaryBubble={isOwn} />
      ) : null}
    </div>
  )

  const shell = (children: ReactNode, extra?: string) => (
    <div
      className={cn(
        "rounded-2xl font-body text-sm leading-relaxed break-words shadow-sm max-w-[min(85%,300px)]",
        isOwn
          ? "bg-primary text-primary-foreground rounded-br-md px-3 py-2"
          : "bg-card text-foreground rounded-bl-md border border-border px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        extra
      )}
    >
      {children}
      {footer}
    </div>
  )

  if (payload.type === "voice") {
    return shell(
      <VoiceMessagePlayer src={payload.url} durationSec={payload.durationSec} isOwn={isOwn} />,
      "px-2.5 py-2"
    )
  }

  if (payload.type === "image") {
    return (
      <div
        className={cn(
          "rounded-2xl overflow-hidden max-w-[min(85%,280px)] shadow-sm",
          isOwn ? "bg-primary/5" : "bg-card border border-border"
        )}
      >
        <div className="relative">
          <a href={payload.url} target="_blank" rel="noopener noreferrer" className="block">
            <Image
              src={payload.url}
              alt=""
              width={280}
              height={200}
              className="max-h-52 w-full object-cover"
              unoptimized
            />
          </a>
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 backdrop-blur-[2px]">
            <span className="font-data text-[10px] tabular-nums text-white/95">{time}</span>
            {showTicks && deliveryStatus ? (
              <MessageTicks status={deliveryStatus} variant="overlay" onPrimaryBubble={false} />
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  return shell(<p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{payload.body}</p>)
}
