import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StreamChatInboxClient } from "@/components/chat/StreamChatInboxClient"

export default async function ChatIndexPage() {
  const supabase = await createClient()
  const { data: userRes } = await supabase.auth.getUser()
  const user = userRes.user

  if (!user) redirect("/login")

  return <StreamChatInboxClient currentUserId={user.id} />
}
