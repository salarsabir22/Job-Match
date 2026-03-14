import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GraduationCap, Calendar, Link2, Github, Linkedin, FileText } from "lucide-react"
import { getInitials } from "@/lib/utils"
import type { Profile, StudentProfile } from "@/types"

interface CandidateCardProps {
  profile: Profile
  studentProfile: StudentProfile
}

export function CandidateCard({ profile, studentProfile }: CandidateCardProps) {
  return (
    <div className="rounded-3xl overflow-hidden bg-card shadow-xl border border-border w-full">
      {/* Header */}
      <div className="h-44 bg-gradient-to-br from-rose-400 via-pink-500 to-violet-600 flex flex-col items-center justify-end pb-5 relative">
        <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className="text-xl font-bold bg-white text-primary">
            {getInitials(profile.full_name || "?")}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <div>
          <h2 className="text-xl font-bold">{profile.full_name}</h2>
          {studentProfile.university && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <GraduationCap className="h-3.5 w-3.5" />
              {studentProfile.university}
              {studentProfile.degree && ` · ${studentProfile.degree}`}
            </p>
          )}
          {studentProfile.graduation_year && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Calendar className="h-3.5 w-3.5" />
              Class of {studentProfile.graduation_year}
            </p>
          )}
        </div>

        {profile.bio && (
          <p className="text-sm text-muted-foreground line-clamp-3">{profile.bio}</p>
        )}

        {studentProfile.skills?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {studentProfile.skills.slice(0, 6).map((s) => (
                <Badge key={s} variant="skill">{s}</Badge>
              ))}
              {studentProfile.skills.length > 6 && (
                <Badge variant="outline">+{studentProfile.skills.length - 6}</Badge>
              )}
            </div>
          </div>
        )}

        {studentProfile.preferred_job_categories?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {studentProfile.preferred_job_categories.slice(0, 3).map((c) => (
              <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          {studentProfile.linkedin_url && (
            <a href={studentProfile.linkedin_url} target="_blank" rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}>
              <Linkedin className="h-4 w-4" />
            </a>
          )}
          {studentProfile.github_url && (
            <a href={studentProfile.github_url} target="_blank" rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}>
              <Github className="h-4 w-4" />
            </a>
          )}
          {studentProfile.portfolio_url && (
            <a href={studentProfile.portfolio_url} target="_blank" rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}>
              <Link2 className="h-4 w-4" />
            </a>
          )}
          {studentProfile.resume_url && (
            <a href={studentProfile.resume_url} target="_blank" rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}>
              <FileText className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
