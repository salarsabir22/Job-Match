"use client"

import { formatDaySeparator } from "@/components/chat/chat-helpers"
import type { DateSeparatorProps } from "stream-chat-react"

export function ChatDateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="my-3 flex items-center justify-center px-4">
      <span className="text-center text-[12px] font-semibold tracking-tight text-[#8E8E93]">
        {formatDaySeparator(date)}
      </span>
    </div>
  )
}
