import Link from "next/link"
import { ArrowLeft, Building2 } from "lucide-react"
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
    <div className="space-y-8">
      <div className="flex items-start gap-3">
        <Link
          href="/discover"
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition hover:bg-neutral-50"
          aria-label="Back to Discover"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        </Link>
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">{job.title}</h1>
          {company?.company_name && (
            <p className="font-body text-sm text-neutral-500">{company.company_name}</p>
          )}
        </div>
      </div>

      <article className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="h-32 bg-neutral-950 flex items-end px-6 pb-5">
          <div className="flex items-end gap-4 min-w-0">
            {company?.logo_url ? (
              <img
                src={company.logo_url}
                alt=""
                className="h-14 w-14 rounded-xl object-cover ring-1 ring-white/10 shrink-0"
              />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center shrink-0 ring-1 ring-white/10">
                <Building2 className="h-6 w-6 text-white/80" aria-hidden />
              </div>
            )}
            <div className="min-w-0 pb-0.5">
              <p className="font-heading font-semibold text-lg text-white leading-snug truncate">{job.title}</p>
              {company?.company_name && (
                <p className="font-body text-sm text-white/65 mt-1 truncate">{company.company_name}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8 space-y-6">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-neutral-100 px-3 py-1 font-body text-xs font-medium text-neutral-800">
              {typeLabel}
            </span>
            {job.is_remote ? (
              <span className="rounded-full bg-neutral-100 px-3 py-1 font-body text-xs font-medium text-neutral-600">
                Remote
              </span>
            ) : job.location ? (
              <span className="rounded-full bg-neutral-100 px-3 py-1 font-body text-xs font-medium text-neutral-600">
                {job.location}
              </span>
            ) : null}
          </div>

          {job.description && (
            <div>
              <h2 className="font-heading text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
                Role
              </h2>
              <p className="font-body text-sm text-neutral-700 leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>
          )}

          {job.required_skills && job.required_skills.length > 0 && (
            <div>
              <h2 className="font-heading text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
                Required
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-md border border-neutral-200 bg-neutral-50/80 px-2.5 py-1 font-body text-xs text-neutral-800"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {job.nice_to_have_skills && job.nice_to_have_skills.length > 0 && (
            <div>
              <h2 className="font-heading text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
                Nice to have
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.nice_to_have_skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-md border border-neutral-100 bg-white px-2.5 py-1 font-body text-xs text-neutral-600"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {company?.description && (
            <div>
              <h2 className="font-heading text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
                {company.company_name ? `About ${company.company_name}` : "Company"}
              </h2>
              <p className="font-body text-sm text-neutral-700 leading-relaxed">{company.description}</p>
            </div>
          )}

          {company?.website_url && (
            <a
              href={company.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-body text-sm font-medium text-neutral-950 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950"
            >
              Company website
            </a>
          )}

          <p className="font-body text-xs text-neutral-400 pt-1 border-t border-neutral-100">
            Posted {formatDate(job.created_at)}
          </p>

          <StudentJobActions userId={userId} jobId={job.id} jobTitle={job.title} />
        </div>
      </article>
    </div>
  )
}
