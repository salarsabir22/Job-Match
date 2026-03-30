import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StreamChatInboxClient } from "@/components/chat/StreamChatInboxClient"

export default async function ChatIndexPage() {
  const supabase = await createClient()
  const { data: userRes } = await supabase.auth.getUser()
  const user = userRes.user

  if (!user) redirect("/login")

  return (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      style={{ height: "calc(100dvh - 10rem)" }}
    >
      <StreamChatInboxClient currentUserId={user.id} />
    </div>
  )
}

