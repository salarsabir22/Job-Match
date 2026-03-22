import Link from "next/link"
import { ArrowLeft, Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatDate } from "@/lib/utils"
import type { Job, RecruiterProfile } from "@/types"
import { StudentJobActions } from "./StudentJobActions"

const JOB_TYPE_LABEL: Record<string, string> = {
  internship: "Internship",
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
}

type JobRow = Omit<Job, "recruiter_profiles"> & { recruiter_profiles: RecruiterProfile | null }

export function StudentJobDetailView({ job, userId }: { job: JobRow; userId: string }) {
  const company = job.recruiter_profiles ?? null
  const typeLabel = JOB_TYPE_LABEL[job.job_type] ?? job.job_type.replace(/_/g, " ")

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start gap-3">
        <Button variant="outline" size="icon" className="mt-0.5 h-10 w-10 shrink-0 rounded-full" asChild>
          <Link href="/discover" aria-label="Back to Discover">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </Button>
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{job.title}</h1>
          {company?.company_name ? <p className="font-body text-sm text-muted-foreground">{company.company_name}</p> : null}
        </div>
      </div>

      <Card className="overflow-hidden shadow-lg ring-1 ring-black/[0.04]">
        <div className="apple-vibrancy-header flex h-32 items-end px-6 pb-5">
          <div className="flex min-w-0 items-end gap-4">
            {company?.logo_url ? (
              <img
                src={company.logo_url}
                alt=""
                className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                <Building2 className="h-6 w-6 text-white/80" aria-hidden />
              </div>
            )}
            <div className="min-w-0 pb-0.5">
              <p className="truncate font-heading text-lg font-semibold leading-snug text-white">{job.title}</p>
              {company?.company_name ? (
                <p className="mt-1 truncate font-body text-sm text-white/65">{company.company_name}</p>
              ) : null}
            </div>
          </div>
        </div>

        <CardContent className="space-y-6 p-5 sm:p-8">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="font-normal">
              {typeLabel}
            </Badge>
            {job.is_remote ? (
              <Badge variant="outline" className="font-normal text-muted-foreground">
                Remote
              </Badge>
            ) : job.location ? (
              <Badge variant="outline" className="font-normal text-muted-foreground">
                {job.location}
              </Badge>
            ) : null}
          </div>

          {job.description ? (
            <div>
              <h2 className="mb-2 font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Role
              </h2>
              <p className="whitespace-pre-line font-body text-sm leading-relaxed text-foreground">{job.description}</p>
            </div>
          ) : null}

          {job.required_skills && job.required_skills.length > 0 ? (
            <div>
              <h2 className="mb-2 font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Required
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-md border border-border bg-muted/50 px-2.5 py-1 font-body text-xs text-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {job.nice_to_have_skills && job.nice_to_have_skills.length > 0 ? (
            <div>
              <h2 className="mb-2 font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Nice to have
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.nice_to_have_skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-md border border-border bg-background px-2.5 py-1 font-body text-xs text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {company?.description ? (
            <div>
              <h2 className="mb-2 font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {company.company_name ? `About ${company.company_name}` : "Company"}
              </h2>
              <p className="font-body text-sm leading-relaxed text-foreground">{company.description}</p>
            </div>
          ) : null}

          {company?.website_url ? (
            <a
              href={company.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-body text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Company website
            </a>
          ) : null}

          <Separator />

          <p className="font-body text-xs text-muted-foreground">Posted {formatDate(job.created_at)}</p>

          <StudentJobActions userId={userId} jobId={job.id} jobTitle={job.title} />
        </CardContent>
      </Card>
    </div>
  )
}
