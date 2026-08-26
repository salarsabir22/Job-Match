import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShareButton } from "@/components/share/ShareButton"
import { ProfileViewTracker } from "@/components/profile/ProfileViewTracker"
import { getInitials } from "@/lib/utils"
import { Calendar, FileText, Github, Globe, Linkedin } from "lucide-react"

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
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, avatar_url, bio, profile_video_url")
    .eq("id", id)
    .maybeSingle()

  if (!profile || profile.role !== "student") notFound()

  const { data: student } = await supabase.from("student_profiles").select("*").eq("id", id).maybeSingle()
  const { data: viewer } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  const isRecruiter = viewer?.role === "recruiter"

  let chatHref: string | null = null
  if (isRecruiter) {
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {isRecruiter ? <ProfileViewTracker studentId={id} /> : null}

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-data text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Candidate</p>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight">{profile.full_name}</h1>
        </div>
        <ShareButton path={`/candidates/${id}`} title={profile.full_name || "Candidate"} />
      </div>

      <Card className="shadow-sm">
        <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
          <Avatar className="h-24 w-24 border-2 border-border">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-xl font-semibold">{getInitials(profile.full_name || "?")}</AvatarFallback>
          </Avatar>
          {student?.university ? (
            <p className="font-body text-sm text-muted-foreground">{student.university}</p>
          ) : null}
          {student?.degree ? <p className="font-body text-sm text-foreground">{student.degree}</p> : null}
          {student?.graduation_year ? (
            <p className="flex items-center gap-1.5 font-body text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Class of {student.graduation_year}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {profile.profile_video_url ? (
        <div className="overflow-hidden rounded-2xl border border-border">
          <video src={profile.profile_video_url} controls playsInline className="aspect-video w-full bg-black" />
        </div>
      ) : null}

      {profile.bio ? (
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <h2 className="mb-2 font-data text-[10px] uppercase tracking-wide text-muted-foreground">About</h2>
            <p className="font-body text-sm leading-relaxed">{profile.bio}</p>
          </CardContent>
        </Card>
      ) : null}

      {student?.skills?.length ? (
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <h2 className="mb-3 font-data text-[10px] uppercase tracking-wide text-muted-foreground">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {student.skills.map((s: string) => (
                <Badge key={s} variant="secondary" className="font-normal">
                  {s}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {links.length > 0 ? (
        <Card className="shadow-sm">
          <CardContent className="space-y-2 p-5">
            <h2 className="mb-2 font-data text-[10px] uppercase tracking-wide text-muted-foreground">Credentials</h2>
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
        <div className="flex flex-col gap-2 sm:flex-row">
          {chatHref ? (
            <Button asChild className="flex-1 rounded-full">
              <Link href={chatHref}>Open chat</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" className="flex-1 rounded-full">
            <Link href="/discover">Back to Discover</Link>
          </Button>
        </div>
      ) : null}
    </div>
  )
}
