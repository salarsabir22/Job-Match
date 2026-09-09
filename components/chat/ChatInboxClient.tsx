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
      c.lastMessage ? previewText(c.lastMessage.content, c.lastMessage.sender_id, currentUserId) : "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    return haystack.includes(q)
  })

  const active = conversations.find((c) => c.id === activeId) ?? null

  if (loading) return <ChatLoadingState />

  return (
    <div className={cn("jm-chat-inbox", active && "jm-chat-inbox--open")}>
      <div className="jm-chat-inbox__list">
        <div className="shrink-0 bg-white px-4 pb-2 pt-3">
          <h1 className="text-[34px] font-bold leading-none tracking-tight text-black">Messages</h1>
          <label className="mt-3 flex items-center gap-2 rounded-[10px] bg-[#E5E5EA] px-2.5 py-1.5">
            <Search className="h-4 w-4 text-[#8E8E93]" strokeWidth={2.25} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-[17px] text-black outline-none placeholder:text-[#8E8E93]"
            />
          </label>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
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
        </div>
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
