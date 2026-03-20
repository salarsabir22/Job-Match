import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GraduationCap, Calendar, Github, Linkedin, Link2, FileText, MapPin } from "lucide-react"
import { getInitials } from "@/lib/utils"
import type { Profile, StudentProfile } from "@/types"

interface CandidateCardProps {
  profile: Profile
  studentProfile: StudentProfile
}

export function CandidateCard({ profile, studentProfile }: CandidateCardProps) {
  return (
    <div className="rounded-3xl overflow-hidden bg-[#0F1115] border border-white/10 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.6)] w-full select-none">
      {/* Header */}
      <div className="relative h-40 bg-gradient-to-br from-[#0a0f1a] via-[#0d1626] to-[#06080f] flex flex-col items-center justify-end pb-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#A3A3A3]/20 via-[#737373]/10 to-transparent pointer-events-none" />
        <div className="absolute top-3 right-3 w-20 h-20 rounded-full bg-[#A3A3A3]/8 blur-xl" />
        <Avatar className="h-16 w-16 border-[3px] border-[#A3A3A3]/40 shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)] relative z-10">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className="text-base font-bold bg-gradient-to-br from-[#A3A3A3] to-[#737373] text-white">
            {getInitials(profile.full_name || "?")}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h2 className="font-heading font-bold text-lg text-white leading-tight">{profile.full_name}</h2>
          {studentProfile.university && (
            <p className="font-body text-xs text-[#94A3B8] flex items-center gap-1 mt-1">
              <GraduationCap className="h-3 w-3 shrink-0" />
              {studentProfile.university}
              {studentProfile.degree && <span className="text-[#94A3B8]/60"> · {studentProfile.degree}</span>}
            </p>
          )}
          {studentProfile.graduation_year && (
            <p className="font-data text-[10px] text-[#94A3B8] flex items-center gap-1 mt-0.5">
              <Calendar className="h-3 w-3 shrink-0" />
              Class of {studentProfile.graduation_year}
            </p>
          )}
        </div>

        {profile.bio && (
          <p className="font-body text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">{profile.bio}</p>
        )}

        {studentProfile.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {studentProfile.skills.slice(0, 5).map((s: string) => (
              <span key={s} className="font-data text-[9px] tracking-wide px-2 py-1 rounded-md bg-[#A3A3A3]/10 border border-[#A3A3A3]/20 text-[#A3A3A3]">
                {s}
              </span>
            ))}
            {studentProfile.skills.length > 5 && (
              <span className="font-data text-[9px] tracking-wide px-2 py-1 rounded-md bg-white/5 border border-white/8 text-[#94A3B8]">
                +{studentProfile.skills.length - 5}
              </span>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-0.5">
          {studentProfile.linkedin_url && (
            <a href={studentProfile.linkedin_url} target="_blank" rel="noopener noreferrer"
              className="text-[#94A3B8] hover:text-[#A3A3A3] transition-colors"
              onClick={(e) => e.stopPropagation()}>
              <Linkedin className="h-3.5 w-3.5" />
            </a>
          )}
          {studentProfile.github_url && (
            <a href={studentProfile.github_url} target="_blank" rel="noopener noreferrer"
              className="text-[#94A3B8] hover:text-white transition-colors"
              onClick={(e) => e.stopPropagation()}>
              <Github className="h-3.5 w-3.5" />
            </a>
          )}
          {studentProfile.portfolio_url && (
            <a href={studentProfile.portfolio_url} target="_blank" rel="noopener noreferrer"
              className="text-[#94A3B8] hover:text-[#FAFAFA] transition-colors"
              onClick={(e) => e.stopPropagation()}>
              <Link2 className="h-3.5 w-3.5" />
            </a>
          )}
          {studentProfile.resume_url && (
            <a href={studentProfile.resume_url} target="_blank" rel="noopener noreferrer"
              className="text-[#94A3B8] hover:text-white transition-colors"
              onClick={(e) => e.stopPropagation()}>
              <FileText className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {/* Swipe hint */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <span className="font-data text-[9px] tracking-wider uppercase text-[#94A3B8]/50">← Pass</span>
          <span className="font-data text-[9px] tracking-wider uppercase text-[#94A3B8]/50">Like →</span>
        </div>
      </div>
    </div>
  )
}
