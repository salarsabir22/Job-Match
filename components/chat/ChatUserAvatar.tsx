"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn, getInitials } from "@/lib/utils"

export function ChatUserAvatar({
  name,
  image,
  online,
  size = "md",
}: {
  name?: string | null
  image?: string | null
  online?: boolean
  size?: "sm" | "md" | "lg"
}) {
  const dim = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-14 w-14" : "h-10 w-10"
  const text = size === "lg" ? "text-[15px]" : size === "sm" ? "text-[10px]" : "text-xs"

  return (
    <div className="relative shrink-0">
      <Avatar className={cn(dim, "bg-[#E5E5EA]")}>
        <AvatarImage src={image || undefined} alt="" />
        <AvatarFallback className={cn("bg-[#C7C7CC] font-semibold text-white", text)}>
          {getInitials(name || "?")}
        </AvatarFallback>
      </Avatar>
      {online ? (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#34C759]" />
      ) : null}
    </div>
  )
}
