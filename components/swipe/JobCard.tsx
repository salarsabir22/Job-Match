import { Building2 } from "lucide-react"
import type { Job } from "@/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatSalary } from "@/lib/jobs/salary"
import { PhotoHero } from "@/components/swipe/PhotoHero"

const JOB_TYPE_LABEL: Record<string, string> = {
  internship: "Internship",
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
}

interface JobCardProps {
  job: Job
  className?: string
  onOpenCompany?: () => void
  reasons?: string[]
}

export function JobCard({ job, className, onOpenCompany, reasons }: JobCardProps) {
  const company = job.recruiter_profiles
  const typeLabel = JOB_TYPE_LABEL[job.job_type] ?? job.job_type
  const locationOrRemote = job.is_remote ? "Remote" : job.location
  const pay = formatSalary({
    min: job.salary_min,
    max: job.salary_max,
    currency: job.salary_currency,
    note: job.compensation_note,
  })

  return (
    <div
      className={cn(
        "w-full select-none overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-lg ring-1 ring-black/[0.04]",
        className
      )}
    >
      <PhotoHero
        src={company?.logo_url}
        fit="contain"
        fallback={<Building2 className="h-16 w-16 text-white/70" aria-hidden />}
      >
        <div className="mb-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-body text-[10px] font-medium uppercase tracking-wide text-white ring-1 ring-white/20">
            {typeLabel}
          </span>
          {locationOrRemote ? (
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-body text-[10px] font-medium text-white/85 ring-1 ring-white/15">
              {locationOrRemote}
            </span>
          ) : null}
        </div>
        <h2 className="font-heading text-xl font-semibold leading-snug tracking-tight text-white">{job.title}</h2>
        {company?.company_name ? (
          onOpenCompany ? (
            <Button
              type="button"
              variant="link"
              className="mt-1 h-auto p-0 font-body text-sm text-white/90"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onOpenCompany()
              }}
            >
              {company.company_name} →
            </Button>
          ) : (
            <p className="mt-1 font-body text-sm text-white/80">{company.company_name}</p>
          )
        ) : null}
        {pay ? <p className="mt-1.5 font-body text-sm font-medium text-white">{pay}</p> : null}
      </PhotoHero>

      <div className="space-y-3 p-4">
        {reasons && reasons.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {reasons.map((reason) => (
              <Badge key={reason} variant="outline" className="font-normal text-primary">
                {reason}
              </Badge>
            ))}
          </div>
        ) : null}

        {job.description ? (
          <p className="line-clamp-2 font-body text-sm leading-relaxed text-muted-foreground">{job.description}</p>
        ) : null}

        {(job.required_skills?.length ?? 0) > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {job.required_skills.slice(0, 6).map((s) => (
              <Badge key={s} variant="secondary" className="text-[11px] font-normal">
                {s}
              </Badge>
            ))}
            {job.required_skills.length > 6 ? (
              <Badge variant="outline" className="border-transparent text-[11px] font-normal text-muted-foreground">
                +{job.required_skills.length - 6}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
