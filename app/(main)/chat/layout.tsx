import { ChatViewportLock } from "@/components/chat/ChatViewportLock"
import "@/components/chat/chat.css"

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatViewportLock>
      <div className="fixed inset-x-0 top-16 bottom-0 z-20 bg-background">
        {children}
      </div>
    </ChatViewportLock>
  )
}
