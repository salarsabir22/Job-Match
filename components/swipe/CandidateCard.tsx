import { Badge } from "@/components/ui/badge"
import { cn, getInitials } from "@/lib/utils"
import type { Profile, StudentProfile } from "@/types"
import { PhotoHero } from "@/components/swipe/PhotoHero"

interface CandidateCardProps {
  profile: Profile
  studentProfile: StudentProfile
  className?: string
  reasons?: string[]
}

export function CandidateCard({ profile, studentProfile, className, reasons }: CandidateCardProps) {
  const links = [
    { href: studentProfile.linkedin_url, label: "LinkedIn" },
    { href: studentProfile.github_url, label: "GitHub" },
    { href: studentProfile.portfolio_url, label: "Portfolio" },
    { href: studentProfile.resume_url, label: "Resume" },
  ].filter((l): l is { href: string; label: string } => Boolean(l.href))

  const school = [studentProfile.university, studentProfile.degree].filter(Boolean).join(" · ")

  return (
    <div
      className={cn(
        "w-full select-none overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-lg ring-1 ring-black/[0.04]",
        className
      )}
    >
      <PhotoHero
        src={profile.avatar_url}
        fallback={
          <span className="font-heading text-4xl font-semibold text-white/80">
            {getInitials(profile.full_name || "?")}
          </span>
        }
      >
        <h2 className="font-heading text-xl font-semibold leading-snug text-white">{profile.full_name}</h2>
        {school ? <p className="mt-1 font-body text-sm text-white/85">{school}</p> : null}
        {studentProfile.graduation_year ? (
          <p className="mt-0.5 font-body text-xs text-white/70">Class of {studentProfile.graduation_year}</p>
        ) : null}
      </PhotoHero>

      <div className="space-y-3 p-4">
        {profile.bio ? (
          <p className="line-clamp-2 font-body text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
        ) : null}

        {reasons && reasons.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {reasons.map((reason) => (
              <Badge key={reason} variant="outline" className="font-normal text-primary">
                {reason}
              </Badge>
            ))}
          </div>
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
          <div className="flex flex-wrap gap-x-3 gap-y-1">
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
    </div>
  )
}
