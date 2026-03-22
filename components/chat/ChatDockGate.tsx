"use client"

import { usePathname } from "next/navigation"
import { FloatingChatDock } from "@/components/chat/FloatingChatDock"

/** Facebook-style dock: hidden on full-page chat and auth routes. */
export function ChatDockGate() {
  const pathname = usePathname()
  if (!pathname) return null
  if (pathname.startsWith("/login") || pathname.startsWith("/auth")) return null
  if (pathname.startsWith("/chat/")) return null
  return <FloatingChatDock />
}
