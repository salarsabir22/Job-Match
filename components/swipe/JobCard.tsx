import { MapPin, Wifi, Calendar, Building2, ExternalLink, Briefcase } from "lucide-react"
import type { Job } from "@/types"

const JOB_TYPE_LABEL: Record<string, string> = {
  internship: "Internship",
  full_time:  "Full-time",
  part_time:  "Part-time",
  contract:   "Contract",
}

interface JobCardProps {
  job: Job
}

export function JobCard({ job }: JobCardProps) {
  const company = (job as any).recruiter_profiles

  return (
    <div className="rounded-3xl overflow-hidden bg-[#0F1115] border border-white/10 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.6)] w-full select-none">

      {/* Header */}
      <div className="relative h-44 bg-gradient-to-br from-[#1a0f00] via-[#2a1200] to-[#0a0600] flex items-center justify-center overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F7931A]/20 via-[#EA580C]/10 to-transparent pointer-events-none" />
        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#F7931A]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          {company?.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.company_name}
              className="h-20 w-20 rounded-2xl object-cover shadow-[0_0_25px_-5px_rgba(247,147,26,0.4)] border border-white/10"
              draggable={false}
            />
          ) : (
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center shadow-[0_0_25px_-5px_rgba(247,147,26,0.5)]">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          )}
        </div>

        {/* Job type badge */}
        <div className="absolute bottom-3 right-4">
          <span className="font-data text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-[#F7931A]/20 border border-[#F7931A]/40 text-[#F7931A]">
            {JOB_TYPE_LABEL[job.job_type] ?? job.job_type}
          </span>
        </div>

        {/* Remote badge */}
        {job.is_remote && (
          <div className="absolute bottom-3 left-4">
            <span className="font-data text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 flex items-center gap-1">
              <Wifi className="h-2.5 w-2.5" />Remote
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Title + company */}
        <div>
          <h2 className="font-heading font-bold text-xl text-white leading-tight">{job.title}</h2>
          {company?.company_name && (
            <p className="font-body text-sm text-[#94A3B8] mt-0.5 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 shrink-0" />
              {company.company_name}
            </p>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-3 font-data text-[10px] tracking-wider text-[#94A3B8]">
          {!job.is_remote && job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />{job.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {JOB_TYPE_LABEL[job.job_type] ?? job.job_type}
          </span>
        </div>

        {/* Description */}
        {job.description && (
          <p className="font-body text-sm text-[#94A3B8] leading-relaxed line-clamp-3">
            {job.description}
          </p>
        )}

        {/* Skills */}
        {(job.required_skills?.length ?? 0) > 0 && (
          <div className="space-y-2">
            <p className="font-data text-[9px] tracking-widest uppercase text-[#94A3B8]">Required Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {job.required_skills.slice(0, 5).map((s) => (
                <span
                  key={s}
                  className="font-data text-[9px] tracking-wider px-2.5 py-1 rounded-full bg-[#F7931A]/10 border border-[#F7931A]/25 text-[#F7931A]"
                >
                  {s}
                </span>
              ))}
              {job.required_skills.length > 5 && (
                <span className="font-data text-[9px] tracking-wider px-2.5 py-1 rounded-full border border-white/10 text-[#94A3B8]">
                  +{job.required_skills.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Company website */}
        {company?.website_url && (
          <a
            href={company.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-body text-xs text-[#F7931A] hover:text-[#FFD600] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            {company.company_name} website
          </a>
        )}
      </div>

      {/* Swipe hint at bottom */}
      <div className="px-5 pb-4 flex items-center justify-between">
        <span className="font-data text-[9px] tracking-wider uppercase text-[#94A3B8]/50">← Pass</span>
        <span className="font-data text-[9px] tracking-wider uppercase text-[#94A3B8]/50">Apply →</span>
      </div>
    </div>
  )
}
