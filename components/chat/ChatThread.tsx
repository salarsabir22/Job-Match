"use client"

import { useEffect, useRef, useState } from "react"
import TextareaAutosize from "react-textarea-autosize"
import { ArrowUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ChatChannelHeader } from "@/components/chat/ChatChannelHeader"
import { ChatEmojiPicker } from "@/components/chat/ChatEmojiPicker"
import { ChatEmptyConversation, ChatErrorState, ChatLoadingState } from "@/components/chat/ChatEmptyState"
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
    <div className="jm-chat flex h-full min-h-0 flex-col bg-white">
      <ChatChannelHeader
        peer={peer}
        jobTitle={jobTitle}
        typing={peerTyping}
        backHref={backHref}
        onBack={onBack}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <ChatEmptyConversation onPick={(text) => void sendMessage(text)} />
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.sender_id === currentUserId
            const prev = messages[i - 1]
            const showDay = shouldShowDaySeparator(msg.created_at, prev?.created_at)
            const grouped = prev && prev.sender_id === msg.sender_id && !showDay
            const status: MessageDeliveryStatus =
              msg._status || (msg.is_read ? "read" : "sent")

            return (
              <div key={msg.id}>
                {showDay ? (
                  <div className="my-3 flex items-center justify-center px-4">
                    <span className="text-center text-[12px] font-semibold tracking-tight text-[#8E8E93]">
                      {formatDaySeparator(new Date(msg.created_at))}
                    </span>
                  </div>
                ) : null}
                <div className={cn("flex", isOwn ? "justify-end" : "justify-start", grouped ? "mt-0.5" : "mt-2")}>
                  <div
                    className={cn(
                      "max-w-[78%] px-3.5 py-2 text-[17px] leading-snug",
                      isOwn
                        ? "rounded-[18px] rounded-br-[5px] bg-[#007AFF] text-white"
                        : "rounded-[18px] rounded-bl-[5px] bg-[#E9E9EB] text-black"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <span
                      className={cn(
                        "mt-1 flex items-center justify-end gap-1 text-[11px]",
                        isOwn ? "text-white/75" : "text-[#8E8E93]"
                      )}
                    >
                      {messageTimeLabel(msg.created_at)}
                      {isOwn ? <MessageTicks status={status} onPrimaryBubble /> : null}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
        {peerTyping ? (
          <div className="mt-2 flex justify-start">
            <div className="flex h-[34px] items-center gap-[5px] rounded-[18px] rounded-bl-[4px] bg-[#E9E9EB] px-3.5">
              <span className="jm-imessage-dot" />
              <span className="jm-imessage-dot jm-imessage-dot--2" />
              <span className="jm-imessage-dot jm-imessage-dot--3" />
              <span className="sr-only">Typing</span>
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
        className="flex shrink-0 items-end gap-2 border-t border-black/[0.08] bg-white px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]"
      >
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
          placeholder="iMessage"
          className="max-h-36 min-h-[36px] flex-1 resize-none rounded-[20px] border border-[#C7C7CC] bg-white px-3.5 py-2 text-[17px] text-black outline-none placeholder:text-[#8E8E93]"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#007AFF] text-white disabled:bg-[#C7C7CC]"
          aria-label="Send"
        >
          <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </form>
    </div>
  )
}
