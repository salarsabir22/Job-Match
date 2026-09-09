"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { ChatUserAvatar } from "@/components/chat/ChatUserAvatar"
import type { ChatPeer } from "@/lib/chat/inbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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
        <Button asChild variant="ghost" size="icon" aria-label="Back to messages">
          <Link href={backHref}>
            <ChevronLeft className="h-6 w-6" strokeWidth={2} />
          </Link>
        </Button>
      ) : onBack ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="lg:hidden"
          aria-label="Back to inbox"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2} />
        </Button>
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
        <Badge variant="outline" className="hidden max-w-[10rem] truncate sm:inline-flex">
          {jobTitle}
        </Badge>
      ) : null}
    </header>
  )
}
