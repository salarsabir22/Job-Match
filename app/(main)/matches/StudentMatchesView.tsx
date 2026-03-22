import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Building2, Heart } from "lucide-react"
import { PageSymbol } from "@/components/ui/page-symbol"
import { formatDate } from "@/lib/utils"

type MatchListItem = {
  id: string
  created_at: string
  conversations?: { id: string }[] | { id: string } | null
  jobs?: {
    title?: string
    job_type?: string
    recruiter_profiles?: { company_name?: string; logo_url?: string | null } | null
  } | null
}

export async function StudentMatchesView({ userId }: { userId: string }) {
  const supabase = await createClient()

  const [matchesRes, appliedRes, savedRes] = await Promise.all([
    supabase
      .from("matches")
      .select("*, jobs(title, job_type, recruiter_profiles(company_name, logo_url)), conversations(id)")
      .eq("student_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("job_swipes")
      .select("id", { count: "exact", head: true })
      .eq("student_id", userId)
      .eq("direction", "right"),
    supabase
      .from("job_swipes")
      .select("id", { count: "exact", head: true })
      .eq("student_id", userId)
      .eq("direction", "saved"),
  ])

  const matches = (matchesRes.data || []) as MatchListItem[]
  const appliedCount = appliedRes.count || 0
  const savedCount = savedRes.count || 0
  const matchRate = appliedCount > 0 ? Math.round((matches.length / appliedCount) * 100) : 0
  const withChat = matches.filter((m) => {
    const c = m.conversations
    return Array.isArray(c) ? c.length > 0 : !!(c && typeof c === "object" && "id" in c)
  }).length

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <PageSymbol icon={Heart} className="sm:mt-0.5" />
        <div className="space-y-1 min-w-0">
          <h1 className="font-heading font-bold text-3xl tracking-tight text-neutral-950">Matches</h1>
          <p className="font-body text-sm text-neutral-600">
            {matches.length === 0
              ? "When a recruiter likes you back, the conversation starts here."
              : `${matches.length} mutual match${matches.length !== 1 ? "es" : ""} — open a thread to keep momentum.`}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl bg-neutral-200/80 overflow-hidden border border-neutral-200/80">
        {[
          { label: "Applied", value: appliedCount },
          { label: "Matches", value: matches.length },
          { label: "Match rate", value: `${matchRate}%` },
          { label: "Active chats", value: withChat },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white px-4 py-4">
            <p className="font-heading text-xl font-semibold tabular-nums text-neutral-950 sm:text-2xl">{value}</p>
            <p className="font-body text-xs text-neutral-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {appliedCount > 0 && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm">
          <h2 className="font-heading text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-4">
            Your pipeline
          </h2>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            {[
              { label: "Applied", value: appliedCount },
              { label: "Saved", value: savedCount },
              { label: "Matched", value: matches.length },
              { label: "In chat", value: withChat },
            ].map(({ label, value }) => (
              <div key={label} className="min-w-[4.5rem]">
                <p className="font-heading text-lg font-semibold tabular-nums text-neutral-950">{value}</p>
                <p className="font-body text-[11px] text-neutral-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {!matches.length ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/50 px-6 py-14 text-center">
          <h3 className="font-heading text-lg font-semibold text-neutral-950">No matches yet</h3>
          <p className="font-body text-sm text-neutral-600 mt-2 max-w-md mx-auto">
            A match happens when you apply and the recruiter returns interest. Strong profiles get there faster.
          </p>
          <ol className="mt-8 max-w-md mx-auto text-left list-decimal list-inside space-y-2 font-body text-sm text-neutral-600">
            <li>Finish your profile — bio, skills, and education.</li>
            <li>Add a resume or portfolio link if you have one.</li>
            <li>Apply to roles that fit; quality beats volume.</li>
          </ol>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/onboarding"
              className="inline-flex justify-center rounded-full border border-neutral-200 bg-white px-6 py-2.5 font-body text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Complete profile
            </Link>
            <Link
              href="/discover"
              className="inline-flex justify-center rounded-full bg-neutral-950 px-6 py-2.5 font-body text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Discover jobs
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="font-body text-sm text-neutral-500">Select a match to open your chat.</p>
          <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4 list-none p-0 m-0">
            {matches.map((match) => {
              const job = match.jobs
              const company = job?.recruiter_profiles
              const convId = Array.isArray(match.conversations)
                ? match.conversations?.[0]?.id
                : match.conversations?.id

              const inner = (
                <div
                  className={`flex items-start gap-4 p-5 rounded-2xl border border-neutral-200 bg-white shadow-sm transition h-full ${
                    convId ? "hover:border-neutral-300 cursor-pointer" : "opacity-95 cursor-default"
                  }`}
                >
                  <div className="h-14 w-14 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 ring-1 ring-neutral-200/80 overflow-hidden">
                    {company?.logo_url ? (
                      <img src={company.logo_url} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <Building2 className="h-7 w-7 text-neutral-400" aria-hidden />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-heading font-semibold text-base text-neutral-950 truncate">{job?.title}</p>
                    <p className="font-body text-sm text-neutral-500 truncate">{company?.company_name}</p>
                    <p className="font-body text-xs text-neutral-400 mt-1">{formatDate(match.created_at)}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 font-body text-[11px] font-medium text-neutral-700">
                        Matched
                      </span>
                      {convId ? (
                        <span className="rounded-full border border-neutral-200 px-2.5 py-0.5 font-body text-[11px] text-neutral-600">
                          Chat ready
                        </span>
                      ) : (
                        <span className="rounded-full border border-neutral-100 px-2.5 py-0.5 font-body text-[11px] text-neutral-500">
                          Chat pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )

              return (
                <li key={match.id}>
                  {convId ? (
                    <Link href={`/chat/${convId}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/20 rounded-2xl">
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
