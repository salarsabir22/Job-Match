"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"
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
    <header className="relative flex shrink-0 items-center gap-3 border-b border-border bg-card/70 px-3 py-3 backdrop-blur-xl">
      {backHref ? (
        <Link
          href={backHref}
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
          aria-label="Back to messages"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2} />
        </Link>
      ) : onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted lg:hidden"
          aria-label="Back to inbox"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2} />
        </button>
      ) : (
        <span className="hidden w-9 lg:block" />
      )}

      <ChatUserAvatar name={name} image={peer.avatar_url} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-sm font-semibold tracking-tight text-foreground">{name}</p>
        {typing ? (
          <p className="text-xs text-primary" aria-live="polite">
            typing
          </p>
        ) : jobTitle ? (
          <p className="truncate text-xs text-muted-foreground">{jobTitle}</p>
        ) : (
          <p className="text-xs text-muted-foreground">Direct message</p>
        )}
      </div>
      {jobTitle ? (
        <span className="hidden max-w-[10rem] truncate rounded-full border border-border bg-muted/80 px-2.5 py-1 font-data text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:inline">
          {jobTitle}
        </span>
      ) : null}
    </header>
  )
}
