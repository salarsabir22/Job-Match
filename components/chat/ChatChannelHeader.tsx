"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ChatUserAvatar } from "@/components/chat/ChatUserAvatar"
import type { ChatPeer } from "@/lib/chat/inbox"

type ChatChannelHeaderProps = {
  peer: ChatPeer
  jobTitle?: string | null
  typing?: boolean
  backHref?: string
  onBack?: () => void
}

export function ChatChannelHeader({
  peer,
  jobTitle,
  typing,
  backHref,
  onBack,
}: ChatChannelHeaderProps) {
  const name = peer.full_name || "Match"

  return (
    <header className="relative flex shrink-0 items-end justify-center border-b border-black/[0.08] bg-[#F9F9F9]/90 px-2 pb-2 pt-1.5 backdrop-blur-xl">
      {backHref ? (
        <Link
          href={backHref}
          className="absolute bottom-2 left-1 flex h-9 w-9 items-center justify-center text-[#007AFF]"
          aria-label="Back to messages"
        >
          <ChevronLeft className="h-7 w-7" strokeWidth={2.25} />
        </Link>
      ) : onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="absolute bottom-2 left-1 flex h-9 w-9 items-center justify-center text-[#007AFF] lg:hidden"
          aria-label="Back to inbox"
        >
          <ChevronLeft className="h-7 w-7" strokeWidth={2.25} />
        </button>
      ) : null}

      <div className="flex flex-col items-center pt-1">
        <ChatUserAvatar name={name} image={peer.avatar_url} size="md" />
        <p className="mt-1 flex max-w-[220px] items-center gap-0.5 truncate text-[12px] font-semibold tracking-tight text-black">
          <span className="truncate">{name}</span>
          <ChevronRight className="h-3 w-3 shrink-0 text-[#C7C7CC]" strokeWidth={2.5} />
        </p>
        {typing ? (
          <p className="text-[11px] text-[#8E8E93]">typing…</p>
        ) : jobTitle ? (
          <p className="max-w-[220px] truncate text-[11px] text-[#8E8E93]">{jobTitle}</p>
        ) : null}
      </div>
    </header>
  )
}
