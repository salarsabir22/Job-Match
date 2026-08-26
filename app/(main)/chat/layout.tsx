import { ChatViewportLock } from "@/components/chat/ChatViewportLock"

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatViewportLock>
      <div className="fixed inset-x-0 top-[52px] bottom-[50px] z-20 bg-background lg:bottom-0 lg:left-56">
        {children}
      </div>
    </ChatViewportLock>
  )
}
