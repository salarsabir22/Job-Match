import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Briefcase, MessageCircle, UserRound } from "lucide-react"
import { getInitials } from "@/lib/utils"
import { ChatWindow } from "@/components/chat/ChatWindow"
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
  const otherUser: Profile = {
    id: otherUserPartial?.id ?? "unknown",
    role: profile?.role === "student" ? "recruiter" : "student",
    full_name: otherUserPartial?.full_name ?? "Unknown user",
    avatar_url: otherUserPartial?.avatar_url ?? null,
    bio: null,
    profile_video_url: null,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  }
  const jobTitle = match?.jobs?.[0]?.title

  return (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      style={{ height: "calc(100dvh - 10rem)" }}
    >
      <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden h-full min-h-0 border-r border-border bg-muted/20 lg:flex lg:flex-col">
          <div className="border-b border-border px-4 py-3.5">
            <Link
              href="/matches"
              className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Back to matches"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <p className="font-heading text-lg font-semibold text-foreground">Messages</p>
            <p className="font-body text-xs text-muted-foreground">Facebook-style conversation view</p>
          </div>
          <div className="space-y-3 p-4">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={otherUser.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                  {getInitials(otherUser.full_name || "?")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-body text-sm font-semibold text-foreground">{otherUser.full_name}</p>
                <p className="flex items-center gap-1 font-data text-[10px] text-muted-foreground">
                  <MessageCircle className="h-3 w-3 shrink-0" />
                  Active conversation
                </p>
              </div>
            </div>
            {jobTitle && (
              <div className="rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground">
                <p className="mb-1 flex items-center gap-1 font-data text-[10px] uppercase tracking-wide text-muted-foreground">
                  <Briefcase className="h-3 w-3 shrink-0" />
                  Job context
                </p>
                <p className="font-body text-sm text-foreground">{jobTitle}</p>
              </div>
            )}
            <div className="rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground">
              <p className="mb-1 flex items-center gap-1 font-data text-[10px] uppercase tracking-wide text-muted-foreground">
                <UserRound className="h-3 w-3 shrink-0" />
                Contact
              </p>
              <p className="font-body text-sm text-foreground">{otherUser.full_name}</p>
              <p className="mt-1 font-body text-xs text-muted-foreground">Use chat on the right to continue the thread.</p>
            </div>
          </div>
        </aside>

        <section className="flex min-h-0 flex-col">
          <div className="z-10 flex shrink-0 items-center gap-3 border-b border-primary/20 bg-primary p-4 text-primary-foreground">
            <Link
              href="/matches"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary-foreground/25 bg-primary-foreground/10 transition-colors hover:bg-primary-foreground/15 lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Avatar className="h-9 w-9 border border-primary-foreground/25">
              <AvatarImage src={otherUser.avatar_url || undefined} />
              <AvatarFallback className="bg-primary-foreground/15 text-xs font-bold text-primary-foreground">
                {getInitials(otherUser.full_name || "?")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-sm font-semibold">{otherUser?.full_name}</p>
              {jobTitle && (
                <p className="flex items-center gap-1 truncate font-data text-[10px] text-primary-foreground/85">
                  <Briefcase className="h-3 w-3 shrink-0 opacity-90" />
                  {jobTitle}
                </p>
              )}
            </div>
            <div
              className="h-2 w-2 shrink-0 rounded-full bg-emerald-400/90 ring-2 ring-primary-foreground/30"
              title="Active"
              aria-hidden
            />
          </div>

          <ChatWindow conversationId={conversation.id} currentUserId={user.id} otherUser={otherUser} />
        </section>
      </div>
    </div>
  )
}
