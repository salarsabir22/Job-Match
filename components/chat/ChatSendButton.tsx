"use client"

import { ArrowUp } from "lucide-react"
import type { SendButtonProps } from "stream-chat-react"
import { useMessageComposerHasSendableData } from "stream-chat-react"
import { cn } from "@/lib/utils"

export function ChatSendButton({ sendMessage, className, ...rest }: SendButtonProps) {
  const canSend = useMessageComposerHasSendableData()
  if (!canSend) return null

  return (
    <button
      type="button"
      onClick={sendMessage}
      className={cn(
        "mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#007AFF] text-white transition active:scale-95",
        className
      )}
      aria-label="Send"
      {...rest}
    >
      <ArrowUp className="h-4 w-4" strokeWidth={2.75} />
    </button>
  )
}
