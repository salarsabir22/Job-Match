"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Loader2, Zap } from "lucide-react"
import { formatTime, getInitials } from "@/lib/utils"
import type { ChannelMessage } from "@/types"

interface ChannelChatProps {
  channelId: string
  currentUserId: string
}

export function ChannelChat({ channelId, currentUserId }: ChannelChatProps) {
  const [messages, setMessages] = useState<ChannelMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  async function loadMessages() {
    const { data } = await supabase.from("channel_messages").select("*, profiles(id, full_name, avatar_url)").eq("channel_id", channelId).order("created_at", { ascending: true }).limit(100)
    setMessages((data as unknown as ChannelMessage[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadMessages()
    })
    const channel = supabase
      .channel(`channel:${channelId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "channel_messages", filter: `channel_id=eq.${channelId}` },
        async (payload) => {
          const { data: msgWithProfile } = await supabase.from("channel_messages").select("*, profiles(id, full_name, avatar_url)").eq("id", payload.new.id).single()
          if (msgWithProfile) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msgWithProfile.id)) return prev
              return [...prev, msgWithProfile as unknown as ChannelMessage]
            })
          }
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [channelId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = newMessage.trim()
    if (!content || sending) return
    setSending(true)
    setNewMessage("")

    // Optimistically add message immediately
    const optimisticMsg: ChannelMessage = {
      id: `optimistic-${Date.now()}`,
      channel_id: channelId,
      sender_id: currentUserId,
      content,
      created_at: new Date().toISOString(),
      profiles: undefined,
    }
    setMessages((prev) => [...prev, optimisticMsg])

    const { data, error } = await supabase
      .from("channel_messages")
      .insert({ channel_id: channelId, sender_id: currentUserId, content })
      .select("*, profiles(id, full_name, avatar_url)")
      .single()

    if (error) {
      // Rollback on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
      setNewMessage(content)
    } else if (data) {
      // Replace optimistic with real message
      setMessages((prev) => prev.map((m) => m.id === optimisticMsg.id ? data as unknown as ChannelMessage : m))
    }

    setSending(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center animate-pulse shadow-[0_0_20px_-3px_rgba(255,255,255,0.6)]">
          <Zap className="h-5 w-5 text-black" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4">
        <div className="py-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="font-body text-sm text-neutral-700">No messages yet. Be the first to say hello!</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isOwn = msg.sender_id === currentUserId
            const sender = msg.profiles
            const showSender = i === 0 || messages[i - 1].sender_id !== msg.sender_id || new Date(msg.created_at).getTime() - new Date(messages[i - 1].created_at).getTime() > 120000

            return (
              <div key={msg.id} className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                {!isOwn && (
                  <Avatar className="h-8 w-8 shrink-0 mt-1 border border-black/10">
                    <AvatarImage src={sender?.avatar_url || undefined} />
                    <AvatarFallback className="bg-white text-neutral-900 text-xs font-bold">
                      {getInitials(sender?.full_name || "?")}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[75%] flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
                  {!isOwn && showSender && (
                    <span className="font-data text-[10px] tracking-wider text-neutral-700 px-1">
                      {sender?.full_name}
                    </span>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl font-body text-sm leading-relaxed ${
                    isOwn
                      ? "bg-neutral-200 text-black rounded-br-sm shadow-[0_0_12px_-5px_rgba(255,255,255,0.4)]"
                      : "bg-white text-black rounded-bl-sm border border-black/10"
                  }`}>
                    {msg.content}
                  </div>
                  <span className="font-data text-[10px] text-neutral-700 px-1">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={sendMessage} className="flex gap-2 p-4 border-t border-black/10 bg-white shrink-0">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Message the channel..."
          disabled={sending}
          className="flex-1 h-11 px-4 rounded-full bg-white border border-black/10 text-black text-sm placeholder:text-black/25 focus:outline-none focus:border-[#FAFAFA]/50 transition-all duration-200"
        />
        <button type="submit" disabled={sending || !newMessage.trim()}
          className="w-11 h-11 rounded-full bg-neutral-200 flex items-center justify-center shadow-[0_0_15px_-3px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_-3px_rgba(255,255,255,0.7)] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none shrink-0">
          {sending ? <Loader2 className="h-4 w-4 text-black animate-spin" /> : <Send className="h-4 w-4 text-black" />}
        </button>
      </form>
    </div>
  )
}
