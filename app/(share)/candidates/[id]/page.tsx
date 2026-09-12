import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShareButton } from "@/components/share/ShareButton"
import { ProfileViewTracker } from "@/components/profile/ProfileViewTracker"
import { ReportBlockMenu } from "@/components/moderation/ReportBlockMenu"
import { getInitials } from "@/lib/utils"
import { Calendar, FileText, Github, Globe, Linkedin } from "lucide-react"
import { ProfilePosts } from "@/components/feed/ProfilePosts"
import { profileSharePath } from "@/lib/share/profile-path"
import type { UserRole } from "@/types"

export default async function CandidatePublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ job?: string }>
}) {
  const { id } = await params
  const { job: jobId } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, avatar_url, bio, profile_video_url")
    .eq("id", id)
    .maybeSingle()

  if (!profile || profile.role !== "student") notFound()

  const { data: student } = await supabase.from("student_profiles").select("*").eq("id", id).maybeSingle()
  const { data: viewer } = user
    ? await supabase.from("profiles").select("id, role, full_name, avatar_url, bio").eq("id", user.id).maybeSingle()
    : { data: null }
  const isRecruiter = viewer?.role === "recruiter"

  let chatHref: string | null = null
  if (isRecruiter && user) {
    let matchQuery = supabase
      .from("matches")
      .select("id, conversations(id)")
      .eq("recruiter_id", user.id)
      .eq("student_id", id)
    if (jobId) matchQuery = matchQuery.eq("job_id", jobId)
    const { data: match } = await matchQuery.order("created_at", { ascending: false }).limit(1).maybeSingle()
    const convRaw = match?.conversations as { id?: string } | { id?: string }[] | null | undefined
    const conv = Array.isArray(convRaw) ? convRaw[0] : convRaw
    chatHref = conv?.id ? `/chat/${conv.id}` : match?.id ? `/chat/${match.id}` : null
  }

  const links = [
    student?.linkedin_url && { href: student.linkedin_url, label: "LinkedIn", icon: Linkedin },
    student?.github_url && { href: student.github_url, label: "GitHub", icon: Github },
    student?.portfolio_url && { href: student.portfolio_url, label: "Portfolio", icon: Globe },
    student?.resume_url && { href: student.resume_url, label: "Resume", icon: FileText },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Linkedin }[]

  const school = [student?.university, student?.degree].filter(Boolean).join(" · ")

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {isRecruiter ? <ProfileViewTracker studentId={id} /> : null}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="relative h-36 sm:h-44">
          {profile.avatar_url ? (
            <>
              <img
                src={profile.avatar_url}
                alt=""
                className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-40"
              />
              <div className="absolute inset-0 bg-[#1d1d1f]/50" />
            </>
          ) : (
            <div className="apple-vibrancy-header absolute inset-0" />
          )}
        </div>
        <div className="relative px-5 pb-5 sm:px-8">
          <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar className="h-20 w-20 border-4 border-background shadow-md sm:h-24 sm:w-24">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-xl font-semibold">{getInitials(profile.full_name || "?")}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 pb-1">
                <p className="font-data text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Candidate</p>
                <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                  {profile.full_name}
                </h1>
                {school ? <p className="mt-1 font-body text-sm text-muted-foreground">{school}</p> : null}
                {student?.graduation_year ? (
                  <p className="mt-0.5 flex items-center gap-1.5 font-body text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Class of {student.graduation_year}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pb-1">
              <ShareButton
                path={`/candidates/${id}`}
                title={profile.full_name || "Candidate"}
                label="Share"
              />
              {user && user.id !== id ? (
                <ReportBlockMenu currentUserId={user.id} peerId={id} peerName={profile.full_name} />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17.5rem]">
        <div className="min-w-0 space-y-6">
          {profile.profile_video_url ? (
            <div className="overflow-hidden rounded-2xl border border-border">
              <video src={profile.profile_video_url} controls playsInline className="aspect-video w-full bg-black" />
            </div>
          ) : null}

          {profile.bio ? (
            <section>
              <h2 className="mb-2 font-heading text-base font-semibold">About</h2>
              <p className="font-body text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
            </section>
          ) : null}

          {student?.skills?.length ? (
            <section>
              <h2 className="mb-3 font-heading text-base font-semibold">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {student.skills.map((s: string) => (
                  <Badge key={s} variant="secondary" className="font-normal">
                    {s}
                  </Badge>
                ))}
              </div>
            </section>
          ) : null}

          <ProfilePosts
            profileUserId={id}
            headline={school || "Student"}
            currentUser={
              user && viewer
                ? {
                    id: user.id,
                    fullName: viewer.full_name || "You",
                    avatarUrl: viewer.avatar_url,
                    role: (viewer.role as UserRole) || "student",
                    headline: null,
                    bio: viewer.bio,
                    profilePath: profileSharePath(viewer.role, user.id),
                  }
                : null
            }
          />
        </div>

        <aside className="space-y-4">
          {links.length > 0 ? (
            <Card>
              <CardContent className="space-y-2 p-5">
                <h2 className="mb-1 font-heading text-sm font-semibold">Credentials</h2>
                {links.map(({ href, label, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-body text-sm text-primary underline-offset-4 hover:underline"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </a>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {isRecruiter ? (
            <div className="flex flex-col gap-2">
              {chatHref ? (
                <Button asChild className="rounded-full">
                  <Link href={chatHref}>Open chat</Link>
                </Button>
              ) : null}
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/discover">Back to Discover</Link>
              </Button>
            </div>
          ) : !user ? (
            <Button asChild className="w-full rounded-full">
              <Link href={`/login?next=${encodeURIComponent(`/candidates/${id}`)}`}>Sign in to connect</Link>
            </Button>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
