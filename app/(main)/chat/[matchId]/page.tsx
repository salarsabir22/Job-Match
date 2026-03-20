import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Briefcase } from "lucide-react"
import { getInitials } from "@/lib/utils"
import { ChatWindow } from "@/components/chat/ChatWindow"

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

  const match = conversation.matches as any
  const otherUser = profile?.role === "student" ? match?.recruiter : match?.student

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-black/10 bg-white" style={{ height: "calc(100dvh - 10rem)" }}>
      {/* Chat header */}
      <div className="flex items-center gap-3 p-4 border-b border-black/10 z-10 shrink-0">
        <Link href="/matches"
          className="w-9 h-9 rounded-full bg-white/5 border border-black/10 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0">
          <ArrowLeft className="h-4 w-4 text-black" />
        </Link>
        <Avatar className="h-9 w-9 border border-[#FAFAFA]/30">
          <AvatarImage src={otherUser?.avatar_url} />
          <AvatarFallback className="bg-white text-neutral-900 text-xs font-bold">
            {getInitials(otherUser?.full_name || "?")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-heading font-semibold text-sm text-black truncate">{otherUser?.full_name}</p>
          {match?.jobs?.title && (
            <p className="font-data text-[10px] text-neutral-700 flex items-center gap-1 truncate">
              <Briefcase className="h-3 w-3" />{match.jobs.title}
            </p>
          )}
        </div>
        <div className="w-2 h-2 rounded-full bg-[#FAFAFA] shadow-[0_0_6px_2px_rgba(255,255,255,0.6)] shrink-0" />
      </div>

      <ChatWindow conversationId={conversation.id} currentUserId={user.id} otherUser={otherUser} />
    </div>
  )
}
