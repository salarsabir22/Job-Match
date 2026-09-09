"use client"

import { useEffect, useRef, useState } from "react"
import TextareaAutosize from "react-textarea-autosize"
import { ArrowUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ChatChannelHeader } from "@/components/chat/ChatChannelHeader"
import { ChatEmojiPicker } from "@/components/chat/ChatEmojiPicker"
import { ChatEmptyConversation, ChatErrorState, ChatLoadingState } from "@/components/chat/ChatEmptyState"
import { ChatUserAvatar } from "@/components/chat/ChatUserAvatar"
import { formatDaySeparator, shouldShowDaySeparator } from "@/components/chat/chat-helpers"
import { MessageTicks, messageTimeLabel, type MessageDeliveryStatus } from "@/components/chat/MessageTicks"
import { cn } from "@/lib/utils"
import type { ChatPeer } from "@/lib/chat/inbox"
import type { Message } from "@/types"
import type { RealtimeChannel } from "@supabase/supabase-js"

type ChatMessageRow = Message & { _status?: MessageDeliveryStatus }

export function ChatThread({
  conversationId,
  currentUserId,
  peer,
  jobTitle,
  backHref,
  onBack,
}: {
  conversationId: string
  currentUserId: string
  peer: ChatPeer
  jobTitle?: string | null
  backHref?: string
  onBack?: () => void
}) {
  const supabase = createClient()
  const [messages, setMessages] = useState<ChatMessageRow[]>([])
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [peerTyping, setPeerTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const liveChannel = useRef<RealtimeChannel | null>(null)

  const markRead = async () => {
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .eq("is_read", false)
      .neq("sender_id", currentUserId)
  }

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      const { data, error: loadError } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, content, is_read, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(300)

      if (cancelled) return
      if (loadError) {
        setError("Could not load messages.")
        setLoading(false)
        return
      }
      setMessages((data as ChatMessageRow[]) ?? [])
      setLoading(false)
      await markRead()
    }

    void load()

    const changes = supabase
      .channel(`messages:${conversationId}`, { config: { broadcast: { self: false } } })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as ChatMessageRow
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id || (m._status === "sending" && m.content === row.content && m.sender_id === row.sender_id))) {
              return prev.map((m) =>
                m.id === row.id || (m._status === "sending" && m.content === row.content && m.sender_id === row.sender_id)
                  ? { ...row, _status: row.is_read ? "read" : "sent" }
                  : m
              )
            }
            return [...prev, { ...row, _status: row.is_read ? "read" : "sent" }]
          })
          if (row.sender_id !== currentUserId) void markRead()
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as ChatMessageRow
          setMessages((prev) => prev.map((m) => (m.id === row.id ? { ...m, ...row, _status: row.is_read ? "read" : "sent" } : m)))
        }
      )
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.userId === currentUserId) return
        setPeerTyping(true)
        if (typingTimer.current) clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => setPeerTyping(false), 1600)
      })
      .subscribe()

    liveChannel.current = changes

    return () => {
      cancelled = true
      liveChannel.current = null
      if (typingTimer.current) clearTimeout(typingTimer.current)
      void supabase.removeChannel(changes)
    }
  }, [conversationId, currentUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, peerTyping])

  const sendTyping = () => {
    void liveChannel.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUserId },
    })
  }

  const sendMessage = async (raw?: string) => {
    const content = (raw ?? draft).trim()
    if (!content || sending) return
    setSending(true)
    if (!raw) setDraft("")

    const optimistic: ChatMessageRow = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
      _status: "sending",
    }
    setMessages((prev) => [...prev, optimistic])

    const { data, error: sendError } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: currentUserId, content })
      .select("id, conversation_id, sender_id, content, is_read, created_at")
      .single()

    if (sendError || !data) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      if (!raw) setDraft(content)
    } else {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? { ...(data as ChatMessageRow), _status: "sent" } : m))
      )
    }
    setSending(false)
  }

  if (loading) return <ChatLoadingState />
  if (error) return <ChatErrorState message={error} />

  return (
    <div className="jm-chat flex h-full min-h-0 flex-col">
      <ChatChannelHeader
        peer={peer}
        jobTitle={jobTitle}
        typing={peerTyping}
        backHref={backHref}
        onBack={onBack}
      />

      <div className="jm-chat-thread min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6">
        {messages.length === 0 ? (
          <ChatEmptyConversation onPick={(text) => void sendMessage(text)} />
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.sender_id === currentUserId
            const prev = messages[i - 1]
            const next = messages[i + 1]
            const showDay = shouldShowDaySeparator(msg.created_at, prev?.created_at)
            const grouped = Boolean(prev && prev.sender_id === msg.sender_id && !showDay)
            const lastInGroup = !next || next.sender_id !== msg.sender_id || shouldShowDaySeparator(next.created_at, msg.created_at)
            const status: MessageDeliveryStatus =
              msg._status || (msg.is_read ? "read" : "sent")
            const peerName = peer.full_name || "Match"

            return (
              <div key={msg.id}>
                {showDay ? (
                  <div className="my-5 flex items-center gap-3" role="separator">
                    <span className="h-px flex-1 bg-border" />
                    <span className="font-data text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      {formatDaySeparator(new Date(msg.created_at))}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                ) : null}
                <div
                  className={cn(
                    "flex gap-2.5",
                    isOwn ? "justify-end" : "justify-start",
                    grouped ? "mt-1" : "mt-4"
                  )}
                >
                  {!isOwn ? (
                    <div className="flex w-8 shrink-0 justify-center pt-0.5">
                      {lastInGroup ? (
                        <ChatUserAvatar name={peerName} image={peer.avatar_url} size="sm" />
                      ) : (
                        <span className="h-8 w-8" aria-hidden />
                      )}
                    </div>
                  ) : null}
                  <div className={cn("max-w-[min(78%,36rem)]", isOwn && "items-end")}>
                    {!isOwn && !grouped ? (
                      <p className="mb-1 px-1 font-heading text-[11px] font-medium text-muted-foreground">
                        {peerName}
                      </p>
                    ) : null}
                    <div
                      className={cn(
                        "px-3.5 py-2.5 font-body text-[15px] leading-relaxed",
                        isOwn
                          ? "rounded-[18px] bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(201,163,106,0.18)]"
                          : "rounded-[18px] border border-border bg-card/90 text-foreground"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                    {lastInGroup ? (
                      <span
                        className={cn(
                          "mt-1 flex items-center gap-1 px-1 font-data text-[10px] text-muted-foreground",
                          isOwn && "justify-end"
                        )}
                      >
                        {messageTimeLabel(msg.created_at)}
                        {isOwn ? <MessageTicks status={status} onPrimaryBubble={false} /> : null}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })
        )}
        {peerTyping ? (
          <div className="mt-4 flex items-center gap-2.5" aria-live="polite">
            <ChatUserAvatar name={peer.full_name} image={peer.avatar_url} size="sm" />
            <div className="flex h-9 items-center gap-1 rounded-[18px] border border-border bg-card/90 px-3">
              <span className="jm-typing-bar" />
              <span className="jm-typing-bar jm-typing-bar--2" />
              <span className="jm-typing-bar jm-typing-bar--3" />
              <span className="sr-only">{peer.full_name || "Match"} is typing</span>
            </div>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void sendMessage()
        }}
        className="shrink-0 bg-gradient-to-t from-background via-background/95 to-transparent px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-2 sm:px-5"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-card px-2 py-2 shadow-[0_16px_40px_rgba(0,0,0,0.28)] focus-within:border-primary/40">
          <ChatEmojiPicker onPick={(emoji) => setDraft((prev) => `${prev}${emoji}`)} />
          <TextareaAutosize
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              sendTyping()
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                void sendMessage()
              }
            }}
            minRows={1}
            maxRows={5}
            placeholder="Message"
            aria-label="Message"
            className="max-h-36 min-h-[40px] flex-1 resize-none bg-transparent px-1.5 py-2 font-body text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:bg-[var(--clearpath-navy-hover)] disabled:opacity-35"
            aria-label="Send message"
          >
            <ArrowUp className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>
      </form>
    </div>
  )
}
