"use client"

import type { ReactElement } from "react"
import {
  Channel,
  MessageInput,
  MessageList,
  Window,
} from "stream-chat-react"
import type { Channel as StreamChannel } from "stream-chat"
import { ChatAttachment } from "@/components/chat/ChatAttachment"
import { ChatChannelHeader } from "@/components/chat/ChatChannelHeader"
import { ChatDateSeparator } from "@/components/chat/ChatDateSeparator"
import { ChatEmojiPicker } from "@/components/chat/ChatEmojiPicker"
import { ChatEmptyConversation, ChatTypingIndicator } from "@/components/chat/ChatEmptyState"
import { ChatMessage } from "@/components/chat/ChatMessage"
import { ChatSendButton } from "@/components/chat/ChatSendButton"

const MESSAGE_ACTIONS = ["react", "quote", "edit", "delete"] as const

type ChatThreadPaneProps = {
  channel?: StreamChannel
  emptyPlaceholder?: ReactElement
  backHref?: string
  onBack?: () => void
  subtitle?: string | null
}

export function ChatThreadPane({
  channel,
  emptyPlaceholder,
  backHref,
  onBack,
  subtitle,
}: ChatThreadPaneProps) {
  return (
    <Channel
      channel={channel}
      EmptyPlaceholder={emptyPlaceholder}
      EmptyStateIndicator={ChatEmptyConversation}
      Message={ChatMessage}
      DateSeparator={ChatDateSeparator}
      EmojiPicker={ChatEmojiPicker}
      Attachment={ChatAttachment}
      TypingIndicator={ChatTypingIndicator}
      SendButton={ChatSendButton}
    >
      <Window>
        <ChatChannelHeader backHref={backHref} onBack={onBack} subtitle={subtitle} />
        <MessageList
          messageActions={[...MESSAGE_ACTIONS]}
          maxTimeBetweenGroupedMessages={120000}
        />
        <MessageInput
          focus
          audioRecordingEnabled
          minRows={1}
          maxRows={5}
          additionalTextareaProps={{ placeholder: "iMessage" }}
        />
      </Window>
    </Channel>
  )
}
