"use client"

import { useState } from "react"
import EmojiPicker, { Theme } from "emoji-picker-react"
import { Smile } from "lucide-react"

export function ChatEmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
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
          <div className="absolute bottom-11 right-0 z-50 overflow-hidden rounded-[20px] border border-border bg-popover shadow-xl">
            <EmojiPicker
              onEmojiClick={(emoji) => {
                onPick(emoji.emoji)
                setOpen(false)
              }}
              width={320}
              height={360}
              theme={Theme.DARK}
              lazyLoadEmojis
              previewConfig={{ showPreview: false }}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}
