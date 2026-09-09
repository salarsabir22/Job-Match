"use client"

import { useState } from "react"
import EmojiPicker from "emoji-picker-react"
import { Smile } from "lucide-react"

export function ChatEmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-[#8E8E93] transition hover:text-[#007AFF]"
        aria-label="Add emoji"
        aria-expanded={open}
      >
        <Smile className="h-[22px] w-[22px]" strokeWidth={1.75} />
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close emoji picker"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-11 right-0 z-50 overflow-hidden rounded-[20px] border border-black/10 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
            <EmojiPicker
              onEmojiClick={(emoji) => {
                onPick(emoji.emoji)
                setOpen(false)
              }}
              width={320}
              height={360}
              lazyLoadEmojis
              previewConfig={{ showPreview: false }}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}
