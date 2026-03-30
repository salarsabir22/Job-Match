import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { StreamChatClient } from "@/components/chat/StreamChatClient"
import type { Profile } from "@/types"

type MatchQueryRow = {
  id: string
  job_id: string
  jobs?: { title?: string | null }[] | null
  student?: Pick<Profile, "id" | "full_name" | "avatar_url">[] | null
  recruiter?: Pick<Profile, "id" | "full_name" | "avatar_url">[] | null
}

export default async function ChatPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  const { data: conversation } = await supabase
    .from("conversations")
    .select(`id, matches(id, job_id, jobs(title), student_id, recruiter_id, student:profiles!matches_student_id_fkey(id, full_name, avatar_url), recruiter:profiles!matches_recruiter_id_fkey(id, full_name, avatar_url))`)
    .eq("id", matchId)
    .single()

  if (!conversation) notFound()

  const rawMatches = conversation.matches as unknown
  const match = (Array.isArray(rawMatches) ? rawMatches[0] : rawMatches) as MatchQueryRow | null | undefined
  const student = match?.student?.[0]
  const recruiter = match?.recruiter?.[0]
  const otherUserPartial = profile?.role === "student" ? recruiter : student
  if (!otherUserPartial?.id) notFound()

  const jobTitle = match?.jobs?.[0]?.title

  return (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      style={{ height: "calc(100dvh - 10rem)" }}
    >
      <StreamChatClient
        conversationId={conversation.id}
        currentUserId={user.id}
        otherUserId={otherUserPartial.id}
        title={jobTitle}
      />
    </div>
  )
}
