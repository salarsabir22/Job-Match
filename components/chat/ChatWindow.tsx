"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Loader2, Zap } from "lucide-react"
import { formatTime, getInitials } from "@/lib/utils"
import type { Message, Profile } from "@/types"

interface ChatWindowProps {
  conversationId: string
  currentUserId: string
  otherUser: Profile
}

export function ChatWindow({ conversationId, currentUserId, otherUser }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadMessages()
    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev
            return [...prev, payload.new as Message]
          })
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const loadMessages = async () => {
    const { data } = await supabase.from("messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true })
    setMessages(data || [])
    setLoading(false)
    if (data?.length) {
      await supabase.from("messages").update({ is_read: true }).eq("conversation_id", conversationId).neq("sender_id", currentUserId).eq("is_read", false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = newMessage.trim()
    if (!content || sending) return
    setSending(true)
    setNewMessage("")

    // Optimistically add message to UI immediately
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
      // Rollback optimistic update on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
      setNewMessage(content)
    } else if (data) {
      // Replace optimistic message with real one
      setMessages((prev) => prev.map((m) => m.id === optimisticMsg.id ? data : m))
    }

    setSending(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#525252] to-[#FAFAFA] flex items-center justify-center animate-pulse shadow-[0_0_20px_-3px_rgba(255,255,255,0.6)]">
          <Zap className="h-5 w-5 text-white" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="py-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Avatar className="h-14 w-14 border-2 border-[#FAFAFA]/30 shadow-[0_0_15px_-5px_rgba(255,255,255,0.4)]">
                <AvatarImage src={otherUser.avatar_url || undefined} />
                <AvatarFallback className="bg-[#0F1115] text-[#FAFAFA] font-bold">
                  {getInitials(otherUser.full_name || "?")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-heading font-semibold text-sm text-white">{otherUser.full_name}</p>
                <p className="font-body text-xs text-[#94A3B8] mt-1">You matched! Send the first message.</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const isOwn = msg.sender_id === currentUserId
            const showTime = i === 0 || new Date(msg.created_at).getTime() - new Date(messages[i - 1].created_at).getTime() > 300000

            return (
              <div key={msg.id}>
                {showTime && (
                  <p className="text-center font-data text-[10px] text-[#94A3B8] my-2">{formatTime(msg.created_at)}</p>
                )}
                <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                  {!isOwn && (
                    <Avatar className="h-7 w-7 shrink-0 mb-1 border border-white/10">
                      <AvatarImage src={otherUser.avatar_url || undefined} />
                      <AvatarFallback className="bg-[#0F1115] text-[#FAFAFA] text-[10px] font-bold">
                        {getInitials(otherUser.full_name || "?")}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl font-body text-sm leading-relaxed ${
                    isOwn
                      ? "bg-gradient-to-br from-[#525252] to-[#FAFAFA] text-white rounded-br-sm shadow-[0_0_15px_-5px_rgba(255,255,255,0.4)]"
                      : "bg-[#0F1115] text-white rounded-bl-sm border border-white/8"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <form onSubmit={sendMessage} className="flex gap-2 p-4 border-t border-white/8 bg-[#0A0B0E] shrink-0">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 h-11 px-4 rounded-full bg-[#0F1115] border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#FAFAFA]/50 transition-all duration-200"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="w-11 h-11 rounded-full bg-gradient-to-br from-[#525252] to-[#FAFAFA] flex items-center justify-center shadow-[0_0_15px_-3px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_-3px_rgba(255,255,255,0.7)] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none shrink-0"
        >
          {sending ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Send className="h-4 w-4 text-white" />}
        </button>
      </form>
    </div>
  )
}
