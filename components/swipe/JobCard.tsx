import { Building2 } from "lucide-react"
import type { Job } from "@/types"
import { cn } from "@/lib/utils"

const JOB_TYPE_LABEL: Record<string, string> = {
  internship: "Internship",
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
}

interface JobCardProps {
  job: Job
  className?: string
}

export function JobCard({ job, className }: JobCardProps) {
  const company = job.recruiter_profiles
  const typeLabel = JOB_TYPE_LABEL[job.job_type] ?? job.job_type
  const locationOrRemote = job.is_remote ? "Remote" : job.location

  return (
    <div
      className={cn(
        "w-full select-none overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-lg ring-1 ring-black/[0.04]",
        className
      )}
    >
      <div className="apple-vibrancy-header relative flex h-40 flex-col items-center justify-center px-5">
        <div className="relative z-10">
          {company?.logo_url ? (
            <img
              src={company.logo_url}
              alt=""
              className="h-[4.25rem] w-[4.25rem] rounded-2xl object-cover ring-1 ring-white/15 shadow-lg"
              draggable={false}
            />
          ) : (
            <div className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <Building2 className="h-9 w-9 text-white/75" aria-hidden />
            </div>
          )}
        </div>

        <div className="absolute bottom-3 left-5 right-5 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full bg-white/12 px-2.5 py-0.5 font-body text-[10px] font-medium uppercase tracking-wide text-white/90 ring-1 ring-white/15">
            {typeLabel}
          </span>
          {locationOrRemote ? (
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-body text-[10px] font-medium text-white/75 ring-1 ring-white/10">
              {locationOrRemote}
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h2 className="font-heading text-lg font-semibold leading-snug tracking-tight text-foreground">{job.title}</h2>
          {company?.company_name ? (
            <p className="mt-1 font-body text-sm text-muted-foreground">{company.company_name}</p>
          ) : null}
        </div>

        {job.description ? (
          <p className="line-clamp-3 font-body text-sm leading-relaxed text-muted-foreground">{job.description}</p>
        ) : null}

        {(job.required_skills?.length ?? 0) > 0 ? (
          <div className="space-y-2">
            <p className="font-data text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Focus</p>
            <div className="flex flex-wrap gap-1.5">
              {job.required_skills.slice(0, 5).map((s) => (
                <span
                  key={s}
                  className="rounded-md border border-border bg-muted/50 px-2 py-0.5 font-body text-[11px] text-foreground"
                >
                  {s}
                </span>
              ))}
              {job.required_skills.length > 5 ? (
                <span className="rounded-md border border-transparent px-2 py-0.5 font-body text-[11px] text-muted-foreground">
                  +{job.required_skills.length - 5}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        {company?.website_url ? (
          <p className="font-body text-xs text-muted-foreground">Full detail panel → website &amp; role</p>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-3">
        <span className="font-body text-[11px] text-muted-foreground">Pass</span>
        <span className="font-body text-[11px] font-medium text-primary">Apply</span>
      </div>
    </div>
  )
}
