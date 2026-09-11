"use client"

import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ChatChannelPreview } from "@/components/chat/ChatChannelPreview"
import { ChatInboxEmpty, ChatLoadingState, ChatSelectPlaceholder } from "@/components/chat/ChatEmptyState"
import { ChatThread } from "@/components/chat/ChatThread"
import { useIsDesktop } from "@/components/chat/chat-helpers"
import { loadInbox, previewText, type InboxConversation } from "@/lib/chat/inbox"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

export function ChatInboxClient({ currentUserId }: { currentUserId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const isDesktop = useIsDesktop()
  const [conversations, setConversations] = useState<InboxConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [activeId, setActiveId] = useState<string | null>(null)

  const refresh = async () => {
    const rows = await loadInbox(supabase, currentUserId)
    setConversations(rows)
    setLoading(false)
    return rows
  }

  useEffect(() => {
    void refresh()

    const channel = supabase
      .channel(`inbox:${currentUserId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        void refresh()
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [currentUserId, supabase])

  useEffect(() => {
    if (isDesktop && !activeId && conversations[0]) setActiveId(conversations[0].id)
  }, [isDesktop, conversations, activeId])

  const filtered = conversations.filter((c) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    const haystack = [
      c.peer.full_name,
      c.jobTitle,
      c.lastMessage
        ? previewText(c.lastMessage.content, c.lastMessage.sender_id, currentUserId, c.lastMessage.message_type)
        : "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    return haystack.includes(q)
  })

  const active = conversations.find((c) => c.id === activeId) ?? null

  const unreadTotal = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  if (loading) return <ChatLoadingState />

  return (
    <div className={cn("jm-chat-inbox", active && "jm-chat-inbox--open")}>
      <div className="jm-chat-inbox__list">
        <div className="shrink-0 px-4 pb-3 pt-5">
          <div className="flex items-end justify-between gap-3">
            <h1 className="font-heading text-[28px] font-semibold tracking-tight text-foreground">Messages</h1>
            {unreadTotal > 0 ? (
              <Badge variant="secondary">{unreadTotal} unread</Badge>
            ) : null}
          </div>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2} />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people or roles"
              className="rounded-full bg-muted/50 pl-9"
              aria-label="Search messages"
            />
          </div>
        </div>
        <ScrollArea className="min-h-0 flex-1 pb-3">
          {filtered.length === 0 ? (
            <ChatInboxEmpty />
          ) : (
            filtered.map((conversation) => (
              <ChatChannelPreview
                key={conversation.id}
                conversation={conversation}
                currentUserId={currentUserId}
                active={conversation.id === activeId}
                onSelect={() => setActiveId(conversation.id)}
              />
            ))
          )}
        </ScrollArea>
      </div>

      <div className="jm-chat-inbox__pane min-h-0">
        {active ? (
          <ChatThread
            conversationId={active.id}
            currentUserId={currentUserId}
            peer={active.peer}
            jobTitle={active.jobTitle}
            onBack={() => setActiveId(null)}
          />
        ) : (
          <ChatSelectPlaceholder />
        )}
      </div>
    </div>
  )
}
