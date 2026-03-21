import { Building2 } from "lucide-react"
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
  const company = job.recruiter_profiles
  const typeLabel = JOB_TYPE_LABEL[job.job_type] ?? job.job_type
  const locationOrRemote = job.is_remote ? "Remote" : job.location

  return (
    <div className="rounded-3xl overflow-hidden bg-white border border-neutral-200 shadow-sm w-full select-none">

      <div className="relative h-40 bg-neutral-950 flex flex-col items-center justify-center px-5">
        <div className="relative z-10">
          {company?.logo_url ? (
            <img
              src={company.logo_url}
              alt=""
              className="h-[4.5rem] w-[4.5rem] rounded-2xl object-cover ring-1 ring-white/10"
              draggable={false}
            />
          ) : (
            <div className="h-[4.5rem] w-[4.5rem] rounded-2xl bg-white/10 flex items-center justify-center ring-1 ring-white/10">
              <Building2 className="h-9 w-9 text-white/70" aria-hidden />
            </div>
          )}
        </div>

        <div className="absolute bottom-3 left-5 right-5 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-body text-[10px] font-medium uppercase tracking-wide text-white/90 ring-1 ring-white/10">
            {typeLabel}
          </span>
          {locationOrRemote && (
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-body text-[10px] font-medium text-white/70 ring-1 ring-white/10">
              {locationOrRemote}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h2 className="font-heading font-semibold text-lg text-neutral-950 leading-snug tracking-tight">
            {job.title}
          </h2>
          {company?.company_name && (
            <p className="font-body text-sm text-neutral-500 mt-1">{company.company_name}</p>
          )}
        </div>

        {job.description && (
          <p className="font-body text-sm text-neutral-600 leading-relaxed line-clamp-3">
            {job.description}
          </p>
        )}

        {(job.required_skills?.length ?? 0) > 0 && (
          <div className="space-y-2">
            <p className="font-heading text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
              Focus
            </p>
            <div className="flex flex-wrap gap-1.5">
              {job.required_skills.slice(0, 5).map((s) => (
                <span
                  key={s}
                  className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-body text-[11px] text-neutral-700"
                >
                  {s}
                </span>
              ))}
              {job.required_skills.length > 5 && (
                <span className="rounded-md border border-neutral-100 px-2 py-0.5 font-body text-[11px] text-neutral-500">
                  +{job.required_skills.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {company?.website_url && (
          <p className="font-body text-xs text-neutral-400">Website linked in full detail →</p>
        )}
      </div>

      <div className="px-5 pb-4 flex items-center justify-between border-t border-neutral-100 pt-3">
        <span className="font-body text-[11px] text-neutral-400">Pass</span>
        <span className="font-body text-[11px] text-neutral-400">Apply</span>
      </div>
    </div>
  )
}
