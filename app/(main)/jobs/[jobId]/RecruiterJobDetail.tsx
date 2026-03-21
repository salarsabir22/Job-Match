import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { Job, RecruiterProfile } from "@/types"
import { JobToggleButton } from "./JobToggleButton"
import { InterestedCandidatesPanel } from "./InterestedCandidatesPanel"

function formatJobType(raw: string) {
  return raw.replace(/_/g, " ")
}

type JobRow = Omit<Job, "recruiter_profiles"> & { recruiter_profiles: RecruiterProfile | null }

export async function RecruiterJobDetail({
  job,
  jobId,
  userId,
}: {
  job: JobRow
  jobId: string
  userId: string
}) {
  const supabase = await createClient()

  const { count: swipeCount } = await supabase
    .from("job_swipes")
    .select("*", { count: "exact", head: true })
    .eq("job_id", jobId)
    .eq("direction", "right")

  const { count: matchCount } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("job_id", jobId)

  const metaParts = [
    formatJobType(job.job_type),
    job.is_remote ? "Remote" : job.location || null,
  ].filter(Boolean)

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3">
        <Link
          href="/jobs"
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition hover:bg-neutral-50"
          aria-label="Back to jobs"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        </Link>
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">{job.title}</h1>
          <p className="font-body text-sm text-neutral-500">{metaParts.join(" · ")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px rounded-2xl bg-neutral-200/80 overflow-hidden border border-neutral-200/80">
        <div className="bg-white px-4 py-4 text-center sm:text-left">
          <p className="font-heading text-2xl font-semibold tabular-nums text-neutral-950">{swipeCount || 0}</p>
          <p className="font-body text-xs text-neutral-500 mt-1">Applications</p>
        </div>
        <div className="bg-white px-4 py-4 text-center sm:text-left">
          <p className="font-heading text-2xl font-semibold tabular-nums text-neutral-950">{matchCount || 0}</p>
          <p className="font-body text-xs text-neutral-500 mt-1">Matches</p>
        </div>
      </div>

      <InterestedCandidatesPanel recruiterId={userId} jobId={jobId} />

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 font-body text-xs font-medium ${
              job.is_active ? "bg-neutral-100 text-neutral-800" : "border border-neutral-200 text-neutral-500"
            }`}
          >
            {job.is_active ? "Active" : "Paused"}
          </span>
          <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 font-body text-xs font-medium text-neutral-700 capitalize">
            {formatJobType(job.job_type)}
          </span>
        </div>

        {job.description && (
          <div>
            <h2 className="font-heading text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
              Description
            </h2>
            <p className="font-body text-sm text-neutral-700 whitespace-pre-line leading-relaxed">{job.description}</p>
          </div>
        )}

        {job.required_skills && job.required_skills.length > 0 && (
          <div>
            <h2 className="font-heading text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
              Required skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {job.required_skills.map((s) => (
                <span
                  key={s}
                  className="rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 font-body text-xs text-neutral-800"
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

        <p className="font-body text-xs text-neutral-400 pt-1">Posted {formatDate(job.created_at)}</p>
      </section>

      <JobToggleButton jobId={job.id} isActive={job.is_active} />
    </div>
  )
}
