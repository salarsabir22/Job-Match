import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import type { Profile, StudentProfile } from "@/types"

interface CandidateCardProps {
  profile: Profile
  studentProfile: StudentProfile
}

export function CandidateCard({ profile, studentProfile }: CandidateCardProps) {
  const links = [
    { href: studentProfile.linkedin_url, label: "LinkedIn" },
    { href: studentProfile.github_url, label: "GitHub" },
    { href: studentProfile.portfolio_url, label: "Portfolio" },
    { href: studentProfile.resume_url, label: "Resume" },
  ].filter((l): l is { href: string; label: string } => Boolean(l.href))

  return (
    <div className="rounded-3xl overflow-hidden bg-white border border-neutral-200 shadow-sm w-full select-none">
      <div className="h-36 bg-neutral-950 flex flex-col items-center justify-end pb-5">
        <Avatar className="h-[4.5rem] w-[4.5rem] ring-2 ring-white/15">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className="text-lg font-semibold bg-white/10 text-white">
            {getInitials(profile.full_name || "?")}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h2 className="font-heading font-semibold text-lg text-neutral-950 leading-snug">
            {profile.full_name}
          </h2>
          {(studentProfile.university || studentProfile.degree) && (
            <p className="font-body text-sm text-neutral-500 mt-1">
              {[studentProfile.university, studentProfile.degree].filter(Boolean).join(" · ")}
            </p>
          )}
          {studentProfile.graduation_year && (
            <p className="font-body text-xs text-neutral-400 mt-1">
              Class of {studentProfile.graduation_year}
            </p>
          )}
        </div>

        {profile.bio && (
          <p className="font-body text-sm text-neutral-600 line-clamp-2 leading-relaxed">{profile.bio}</p>
        )}

        {studentProfile.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {studentProfile.skills.slice(0, 5).map((s: string) => (
              <span
                key={s}
                className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-body text-[11px] text-neutral-700"
              >
                {s}
              </span>
            ))}
            {studentProfile.skills.length > 5 && (
              <span className="rounded-md border border-neutral-100 px-2 py-0.5 font-body text-[11px] text-neutral-500">
                +{studentProfile.skills.length - 5}
              </span>
            )}
          </div>
        )}

        {links.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-neutral-100 pt-3">
            {links.map(({ href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-xs font-medium text-neutral-600 underline decoration-neutral-200 underline-offset-2 hover:text-neutral-950 hover:decoration-neutral-400"
                onClick={(e) => e.stopPropagation()}
              >
                {label}
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
          <span className="font-body text-[11px] text-neutral-400">Pass</span>
          <span className="font-body text-[11px] text-neutral-400">Like</span>
        </div>
      </div>
    </div>
  )
}
