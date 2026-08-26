"use client"

import { MessageCircle } from "lucide-react"
import { useChatContext, useChannelStateContext, useTypingContext } from "stream-chat-react"
import type { EmptyStateIndicatorProps } from "stream-chat-react"
import { ICEBREAKERS } from "@/components/chat/chat-helpers"

export function ChatInboxEmpty(_props: EmptyStateIndicatorProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 py-12 text-center">
      <p className="text-[20px] font-semibold tracking-tight text-black">No Messages</p>
      <p className="mt-1 max-w-[240px] text-[15px] leading-snug text-[#8E8E93]">
        When you match, chats land here. Same energy as iMessage.
      </p>
    </div>
  )
}

export function ChatEmptyConversation({ listType }: EmptyStateIndicatorProps) {
  const { channel } = useChannelStateContext("ChatEmptyConversation")

  if (listType === "channel") return <ChatInboxEmpty />

  const send = async (text: string) => {
    await channel.sendMessage({ text })
  }

  return (
    <div className="flex h-full flex-col items-center justify-end px-6 pb-8 text-center">
      <p className="text-[13px] font-semibold text-[#8E8E93]">iMessage</p>
      <p className="mt-1 max-w-sm text-[15px] text-[#8E8E93]">
        This is the beginning of your conversation. Messages are end-to-end with your match.
      </p>
      <div className="mt-5 flex w-full max-w-sm flex-col items-end gap-2">
        {ICEBREAKERS.map((line) => (
          <button
            key={line}
            type="button"
            onClick={() => void send(line)}
            className="max-w-[85%] rounded-[18px] rounded-br-[4px] border border-[#007AFF]/40 bg-white px-3.5 py-2 text-left text-[15px] leading-snug text-[#007AFF] transition active:bg-[#007AFF]/8"
          >
            {line}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ChatSelectPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-white px-6 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#E9E9EB] text-[#8E8E93]">
        <MessageCircle className="h-7 w-7" />
      </div>
      <p className="text-[20px] font-semibold tracking-tight text-black">Messages</p>
      <p className="mt-1 max-w-xs text-[15px] text-[#8E8E93]">
        Select a conversation to start messaging.
      </p>
    </div>
  )
}

export function ChatLoadingState() {
  return (
    <div className="flex h-full items-center justify-center bg-white">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#C7C7CC] border-t-[#007AFF]" />
      <span className="sr-only">Loading chat</span>
    </div>
  )
}

export function ChatErrorState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-white px-6 text-center">
      <p className="max-w-sm text-[15px] text-[#8E8E93]">{message}</p>
    </div>
  )
}

export function ChatTypingIndicator() {
  const { client } = useChatContext("ChatTypingIndicator")
  const { typing } = useTypingContext("ChatTypingIndicator")
  const others = Object.values(typing ?? {}).filter((t) => t.user?.id && t.user.id !== client.userID)

  if (!others.length) return null

  return (
    <div className="flex justify-start px-4 pb-2">
      <div className="flex h-[34px] items-center gap-[5px] rounded-[18px] rounded-bl-[4px] bg-[#E9E9EB] px-3.5">
        <span className="jm-imessage-dot" />
        <span className="jm-imessage-dot jm-imessage-dot--2" />
        <span className="jm-imessage-dot jm-imessage-dot--3" />
        <span className="sr-only">Typing</span>
      </div>
    </div>
  )
}
