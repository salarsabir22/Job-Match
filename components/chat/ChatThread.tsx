"use client"

import { useEffect, useRef, useState, type PointerEvent } from "react"
import TextareaAutosize from "react-textarea-autosize"
import { ArrowUp, Mic } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ChatChannelHeader } from "@/components/chat/ChatChannelHeader"
import { ChatEmojiPicker } from "@/components/chat/ChatEmojiPicker"
import { ChatEmptyConversation, ChatErrorState, ChatLoadingState } from "@/components/chat/ChatEmptyState"
import { ChatUserAvatar } from "@/components/chat/ChatUserAvatar"
import { ChatVoiceBubble } from "@/components/chat/ChatVoiceBubble"
import { ChatVoiceRecordBar } from "@/components/chat/ChatVoiceRecordBar"
import { formatDaySeparator, shouldShowDaySeparator } from "@/components/chat/chat-helpers"
import { MessageTicks, messageTimeLabel, type MessageDeliveryStatus } from "@/components/chat/MessageTicks"
import {
  formatVoiceClock,
  MAX_VOICE_SECONDS,
  pickAudioMime,
  useVoiceRecorder,
} from "@/components/chat/use-voice-recorder"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useToast } from "@/lib/hooks/use-toast"
import type { ChatPeer } from "@/lib/chat/inbox"
import type { Message } from "@/types"
import type { RealtimeChannel } from "@supabase/supabase-js"

type ChatMessageRow = Message & { _status?: MessageDeliveryStatus }

const MESSAGE_COLS =
  "id, conversation_id, sender_id, content, is_read, created_at, message_type, media_url, duration_seconds"

function isSameOptimistic(pending: ChatMessageRow, row: ChatMessageRow) {
  if (pending.id === row.id) return true
  if (pending._status !== "sending" || pending.sender_id !== row.sender_id) return false
  if (row.message_type === "voice" || pending.message_type === "voice") {
    return pending.message_type === "voice" && row.message_type === "voice"
  }
  return pending.content === row.content
}

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
  const { toast } = useToast()
  const [messages, setMessages] = useState<ChatMessageRow[]>([])
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [peerTyping, setPeerTyping] = useState(false)
  const [holdRecording, setHoldRecording] = useState(false)
  const [slideCancel, setSlideCancel] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const liveChannel = useRef<RealtimeChannel | null>(null)
  const holdStart = useRef<{ x: number; t: number } | null>(null)

  const sendVoiceRef = useRef<(blob: Blob, duration: number) => Promise<void>>(async () => {})

  const voice = useVoiceRecorder((result) => {
    void sendVoiceRef.current(result.blob, result.duration)
  })

  const markRead = async () => {
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .eq("is_read", false)
      .neq("sender_id", currentUserId)
  }

  const sendVoice = async (blob: Blob, duration: number) => {
    if (sending) return
    setSending(true)
    const localUrl = URL.createObjectURL(blob)
    const optimistic: ChatMessageRow = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: "Voice message",
      is_read: false,
      created_at: new Date().toISOString(),
      message_type: "voice",
      media_url: localUrl,
      duration_seconds: duration,
      _status: "sending",
    }
    setMessages((prev) => [...prev, optimistic])

    const { ext } = pickAudioMime()
    const path = `${currentUserId}/${conversationId}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from("chat-media").upload(path, blob, {
      contentType: blob.type || "audio/webm",
      upsert: false,
    })

    if (uploadError) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      URL.revokeObjectURL(localUrl)
      toast({ title: "Could not send voice note", description: uploadError.message, variant: "destructive" })
      setSending(false)
      return
    }

    const { data: urlData } = supabase.storage.from("chat-media").getPublicUrl(path)
    const { data, error: sendError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: "Voice message",
        message_type: "voice",
        media_url: urlData.publicUrl,
        duration_seconds: duration,
      })
      .select(MESSAGE_COLS)
      .single()

    if (sendError || !data) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      toast({
        title: "Could not send voice note",
        description: sendError?.message ?? "Try again",
        variant: "destructive",
      })
    } else {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimistic.id ? { ...(data as ChatMessageRow), _status: "sent" } : m
        )
      )
    }
    URL.revokeObjectURL(localUrl)
    setSending(false)
  }

  sendVoiceRef.current = sendVoice

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      const { data, error: loadError } = await supabase
        .from("messages")
        .select(MESSAGE_COLS)
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
            if (prev.some((m) => isSameOptimistic(m, row))) {
              return prev.map((m) =>
                isSameOptimistic(m, row) ? { ...row, _status: row.is_read ? "read" : "sent" } : m
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
    if (!content || sending || voice.recording) return
    setSending(true)
    if (!raw) setDraft("")

    const optimistic: ChatMessageRow = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
      message_type: "text",
      _status: "sending",
    }
    setMessages((prev) => [...prev, optimistic])

    const { data, error: sendError } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: currentUserId, content, message_type: "text" })
      .select(MESSAGE_COLS)
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

  const startRecording = async () => {
    try {
      await voice.start()
    } catch (e) {
      setHoldRecording(false)
      holdStart.current = null
      const msg = e instanceof Error ? e.message : "Allow microphone access to record."
      toast({ title: "Microphone required", description: msg, variant: "destructive" })
    }
  }

  const finishRecording = async () => {
    setHoldRecording(false)
    setSlideCancel(false)
    holdStart.current = null
    const result = await voice.stop()
    if (result) await sendVoice(result.blob, result.duration)
  }

  const abortRecording = () => {
    setHoldRecording(false)
    setSlideCancel(false)
    holdStart.current = null
    voice.cancel()
  }

  const slideCancelRef = useRef(false)
  slideCancelRef.current = slideCancel

  useEffect(() => {
    if (!holdRecording) return
    const onMove = (e: globalThis.PointerEvent) => {
      if (!holdStart.current) return
      setSlideCancel(e.clientX - holdStart.current.x < -72)
    }
    const onUp = () => {
      void (async () => {
        if (!holdStart.current) {
          setHoldRecording(false)
          return
        }
        const held = Date.now() - holdStart.current.t
        const cancel = slideCancelRef.current
        holdStart.current = null
        setHoldRecording(false)
        if (cancel) {
          voice.cancel()
          setSlideCancel(false)
          return
        }
        if (held >= 380) {
          const result = await voice.stop()
          setSlideCancel(false)
          if (result) await sendVoiceRef.current(result.blob, result.duration)
          return
        }
        setSlideCancel(false)
      })()
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
  }, [holdRecording])

  const onMicPointerDown = async (e: PointerEvent<HTMLButtonElement>) => {
    if (sending) return
    e.preventDefault()
    holdStart.current = { x: e.clientX, t: Date.now() }
    setSlideCancel(false)
    setHoldRecording(true)
    await startRecording()
  }

  if (loading) return <ChatLoadingState />
  if (error) return <ChatErrorState message={error} />

  const canSendText = Boolean(draft.trim()) && !sending && !voice.recording

  return (
    <div className="jm-chat flex h-full min-h-0 flex-col">
      <ChatChannelHeader
        peer={peer}
        jobTitle={jobTitle}
        typing={peerTyping}
        backHref={backHref}
        onBack={onBack}
      />

      <div className="jm-chat-thread min-h-0 flex-1 overflow-y-auto px-2 py-3 sm:px-4">
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
            const isVoice = msg.message_type === "voice" && Boolean(msg.media_url)
            const ticks = isOwn ? <MessageTicks status={status} onPrimaryBubble={isOwn} /> : null

            return (
              <div key={msg.id}>
                {showDay ? (
                  <div className="my-3 flex justify-center" role="separator">
                    <span className="rounded-full bg-muted/80 px-3 py-1 font-data text-[11px] text-muted-foreground shadow-sm">
                      {formatDaySeparator(new Date(msg.created_at))}
                    </span>
                  </div>
                ) : null}
                <div
                  className={cn(
                    "flex",
                    isOwn ? "justify-end" : "justify-start",
                    grouped ? "mt-0.5" : "mt-2.5"
                  )}
                >
                  <div
                    className={cn(
                      "jm-bubble px-2.5 pb-1 pt-1.5 font-body text-[14.5px] leading-[1.35]",
                      isOwn ? "jm-bubble--own" : "jm-bubble--peer",
                      grouped && !lastInGroup && "jm-bubble--grouped"
                    )}
                  >
                    {isVoice ? (
                      <ChatVoiceBubble
                        src={msg.media_url as string}
                        durationSeconds={msg.duration_seconds ?? 1}
                        own={isOwn}
                        timeLabel={messageTimeLabel(msg.created_at)}
                        ticks={ticks}
                      />
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap break-words px-0.5 pt-0.5">{msg.content}</p>
                        {lastInGroup ? (
                          <span
                            className={cn(
                              "mt-1 flex items-center justify-end gap-1 px-0.5 font-data text-[10px]",
                              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}
                          >
                            {messageTimeLabel(msg.created_at)}
                            {ticks}
                          </span>
                        ) : null}
                      </>
                    )}
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
        className="shrink-0 bg-gradient-to-t from-background via-background/95 to-transparent px-2 pb-[calc(0.65rem+env(safe-area-inset-bottom,0px))] pt-1.5 sm:px-4"
      >
        {voice.recording ? (
          <ChatVoiceRecordBar
            elapsed={voice.elapsed}
            slideCancel={slideCancel}
            locked={!holdRecording}
            onCancel={abortRecording}
            onSend={() => void finishRecording()}
          />
        ) : (
          <div className="flex items-end gap-2">
            <div className="flex min-w-0 flex-1 items-end rounded-full border border-border bg-card py-0.5 pl-0.5 pr-3 shadow-[0_10px_28px_rgba(0,0,0,0.22)] focus-within:border-primary/40">
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
                className="max-h-36 min-h-[42px] flex-1 resize-none bg-transparent py-2.5 font-body text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            {canSendText ? (
              <Button
                type="submit"
                size="icon"
                disabled={sending}
                className="h-12 w-12 shrink-0 rounded-full"
                aria-label="Send message"
              >
                <ArrowUp className="h-5 w-5" strokeWidth={2.4} />
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                className="jm-mic-hold h-12 w-12 shrink-0 rounded-full"
                disabled={sending}
                onPointerDown={(e) => void onMicPointerDown(e)}
                onContextMenu={(e) => e.preventDefault()}
                aria-label="Hold to record voice message"
              >
                <Mic className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
