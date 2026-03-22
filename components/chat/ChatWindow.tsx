"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  ImageIcon,
  Loader2,
  Mic,
  Send,
  Smile,
  Square,
  Trash2,
  X,
  Zap,
} from "lucide-react"
import { formatTime, getInitials } from "@/lib/utils"
import type { Message, Profile } from "@/types"
import {
  parseChatPayload,
  serializeImage,
  serializeText,
  serializeVoice,
  type ChatPayload,
} from "@/lib/chat-message"
import TextareaAutosize from "react-textarea-autosize"
import { useVoiceRecorder } from "@/components/chat/useVoiceRecorder"
import { cn } from "@/lib/utils"

import { Theme } from "emoji-picker-react"

const EmojiPicker = dynamic(
  () => import("emoji-picker-react").then((m) => m.default),
  { ssr: false }
)

const CHAT_MEDIA_BUCKET = "chat-media"

interface ChatWindowProps {
  conversationId: string
  currentUserId: string
  otherUser: Profile
  /** Full-page chat vs compact dock */
  variant?: "page" | "dock"
}

function MessageBubble({
  payload,
  isOwn,
}: {
  payload: ChatPayload
  isOwn: boolean
}) {
  const bubble = cn(
    "max-w-[85%] rounded-2xl font-body text-sm leading-relaxed break-words",
    isOwn
      ? "bg-primary text-primary-foreground rounded-br-md px-3.5 py-2 shadow-sm"
      : "bg-primary/5 text-foreground rounded-bl-md border border-primary/20 px-3.5 py-2"
  )

  if (payload.type === "voice") {
    return (
      <div className={bubble}>
        <audio
          src={payload.url}
          controls
          className="h-9 w-[min(100%,220px)] max-w-full"
          preload="metadata"
        />
        {payload.durationSec > 0 && (
          <p className="font-data text-[10px] opacity-80 mt-1">{payload.durationSec}s</p>
        )}
      </div>
    )
  }

  if (payload.type === "image") {
    return (
      <div className={cn(bubble, "p-1.5 overflow-hidden")}>
        <a href={payload.url} target="_blank" rel="noopener noreferrer" className="block">
          <Image
            src={payload.url}
            alt=""
            width={280}
            height={200}
            className="rounded-xl max-h-48 w-auto object-contain"
            unoptimized
          />
        </a>
      </div>
    )
  }

  return <div className={bubble}>{payload.body}</div>
}

export function ChatWindow({ conversationId, currentUserId, otherUser, variant = "page" }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [uploadingVoice, setUploadingVoice] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const { recording, durationSec, start, stop, cancel } = useVoiceRecorder()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isDock = variant === "dock"

  async function loadMessages() {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
    setMessages(data || [])
    setLoading(false)
    if (data?.length) {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", currentUserId)
        .eq("is_read", false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadMessages()
    })
    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev
            return [...prev, payload.new as Message]
          })
        }
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const insertMessage = async (content: string) => {
    if (!content.trim()) return
    const optimisticMsg: Message = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticMsg])

    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: currentUserId, content })
      .select()
      .single()

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
      return
    }
    if (data) {
      setMessages((prev) => prev.map((m) => (m.id === optimisticMsg.id ? data : m)))
    }
  }

  const uploadToChatMedia = async (blob: Blob, ext: string) => {
    const path = `${currentUserId}/${conversationId}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from(CHAT_MEDIA_BUCKET).upload(path, blob, {
      contentType: blob.type || "application/octet-stream",
      upsert: false,
    })
    if (error) throw error
    const { data } = supabase.storage.from(CHAT_MEDIA_BUCKET).getPublicUrl(path)
    return data.publicUrl
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const raw = newMessage.trim()
    if (!raw || sending) return
    const content = serializeText(raw)
    if (!content) return
    setSending(true)
    setNewMessage("")
    setEmojiOpen(false)
    await insertMessage(content)
    setSending(false)
  }

  const sendVoiceMessage = async () => {
    setUploadingVoice(true)
    try {
      const result = await stop()
      if (!result || result.blob.size < 100) {
        setUploadingVoice(false)
        return
      }
      const ext = result.blob.type.includes("webm") ? "webm" : "mp4"
      const url = await uploadToChatMedia(result.blob, ext)
      const content = serializeVoice(url, result.durationSec)
      await insertMessage(content)
    } catch {
      /* optional toast */
    } finally {
      setUploadingVoice(false)
    }
  }

  const onImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !file.type.startsWith("image/")) return
    setUploadingImage(true)
    try {
      const ext = file.name.split(".").pop() || "jpg"
      const url = await uploadToChatMedia(file, ext)
      const content = serializeImage(url)
      await insertMessage(content)
    } catch {
      /* */
    } finally {
      setUploadingImage(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 min-h-[200px]">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center animate-pulse">
          <Zap className="h-5 w-5 text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className={cn("flex-1 overflow-y-auto", isDock ? "px-3" : "px-4")}>
        <div className="py-3 space-y-2">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Avatar className="h-12 w-12 border border-border shadow-sm">
                <AvatarImage src={otherUser.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {getInitials(otherUser.full_name || "?")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-heading font-semibold text-sm text-foreground">{otherUser.full_name}</p>
                <p className="font-body text-xs text-muted-foreground mt-1">You matched — say hello.</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const isOwn = msg.sender_id === currentUserId
            const payload = parseChatPayload(msg.content)
            const showTime =
              i === 0 ||
              new Date(msg.created_at).getTime() - new Date(messages[i - 1].created_at).getTime() > 300000

            return (
              <div key={msg.id}>
                {showTime && (
                  <p className="text-center font-data text-[10px] text-muted-foreground my-2">
                    {formatTime(msg.created_at)}
                  </p>
                )}
                <div className={cn("flex items-end gap-2", isOwn ? "flex-row-reverse" : "flex-row")}>
                  {!isOwn && (
                    <Avatar className="h-7 w-7 shrink-0 mb-0.5 border border-primary/20">
                      <AvatarImage src={otherUser.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                        {getInitials(otherUser.full_name || "?")}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <MessageBubble payload={payload} isOwn={isOwn} />
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Recording overlay */}
      {recording && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border bg-destructive/5 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse shrink-0" />
            <span className="font-data text-xs text-destructive font-medium">Recording {durationSec}s</span>
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={cancel} aria-label="Cancel recording">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1"
              onClick={() => void sendVoiceMessage()}
              disabled={uploadingVoice}
            >
              {uploadingVoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={sendMessage} className={cn("shrink-0 border-t border-border bg-card", isDock ? "p-2" : "p-3")}>
        {emojiOpen && (
          <div className="mb-2 relative z-10">
            <EmojiPicker
              theme={Theme.LIGHT}
              onEmojiClick={(e) => {
                setNewMessage((m) => m + e.emoji)
              }}
              width={isDock ? Math.min(320, typeof window !== "undefined" ? window.innerWidth - 32 : 320) : 320}
              height={isDock ? 260 : 320}
              skinTonesDisabled
            />
          </div>
        )}

        <div className="flex items-end gap-1.5">
          <div className="relative flex-1 rounded-2xl border border-primary/15 bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary/25">
            <div className="flex items-end gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
                onClick={() => setEmojiOpen((o) => !o)}
                aria-label="Emoji"
              >
                <Smile className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onImagePick(e)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage || recording}
                aria-label="Photo"
              >
                {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 shrink-0",
                  recording ? "text-destructive" : "text-muted-foreground hover:text-primary"
                )}
                onClick={() => void (recording ? sendVoiceMessage() : start())}
                disabled={uploadingVoice || sending}
                aria-label={recording ? "Stop and send voice" : "Record voice"}
              >
                {recording ? <Square className="h-3.5 w-3.5 fill-current" /> : <Mic className="h-4 w-4" />}
              </Button>
              <TextareaAutosize
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Message…"
                disabled={sending || recording}
                minRows={1}
                maxRows={isDock ? 4 : 6}
                className="flex-1 min-h-[36px] max-h-32 resize-none bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    e.currentTarget.form?.requestSubmit()
                  }
                }}
              />
            </div>
          </div>
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full"
            disabled={sending || !newMessage.trim() || recording}
            aria-label="Send"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  )
}
