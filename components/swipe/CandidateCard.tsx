import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn, getInitials } from "@/lib/utils"
import type { Profile, StudentProfile } from "@/types"

interface CandidateCardProps {
  profile: Profile
  studentProfile: StudentProfile
  className?: string
}

export function CandidateCard({ profile, studentProfile, className }: CandidateCardProps) {
  const links = [
    { href: studentProfile.linkedin_url, label: "LinkedIn" },
    { href: studentProfile.github_url, label: "GitHub" },
    { href: studentProfile.portfolio_url, label: "Portfolio" },
    { href: studentProfile.resume_url, label: "Resume" },
  ].filter((l): l is { href: string; label: string } => Boolean(l.href))

  return (
    <div
      className={cn(
        "w-full select-none overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-lg ring-1 ring-black/[0.04]",
        className
      )}
    >
      <div className="apple-vibrancy-header relative flex h-36 flex-col items-center justify-end pb-5">
        <Avatar className="h-[4.25rem] w-[4.25rem] ring-2 ring-white/20 shadow-lg">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className="bg-white/10 text-lg font-semibold text-white">
            {getInitials(profile.full_name || "?")}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="space-y-4 p-5 pb-0">
        <div>
          <h2 className="font-heading text-lg font-semibold leading-snug text-foreground">{profile.full_name}</h2>
          {studentProfile.university || studentProfile.degree ? (
            <p className="mt-1 font-body text-sm text-muted-foreground">
              {[studentProfile.university, studentProfile.degree].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          {studentProfile.graduation_year ? (
            <p className="mt-1 font-body text-xs text-muted-foreground">Class of {studentProfile.graduation_year}</p>
          ) : null}
        </div>

        {profile.bio ? (
          <p className="line-clamp-2 font-body text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
        ) : null}

        {studentProfile.skills && studentProfile.skills.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {studentProfile.skills.slice(0, 5).map((s: string) => (
              <Badge key={s} variant="secondary" className="text-[11px] font-normal">
                {s}
              </Badge>
            ))}
            {studentProfile.skills.length > 5 ? (
              <Badge variant="outline" className="border-transparent text-[11px] font-normal text-muted-foreground">
                +{studentProfile.skills.length - 5}
              </Badge>
            ) : null}
          </div>
        ) : null}

        {links.length > 0 ? (
          <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-border pt-3">
            {links.map(({ href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-xs font-medium text-primary underline-offset-4 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {label}
              </a>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-3">
        <span className="font-body text-[11px] font-medium text-muted-foreground">← Pass</span>
        <span className="font-body text-[11px] font-medium text-primary">Shortlist →</span>
      </div>
    </div>
  )
}
