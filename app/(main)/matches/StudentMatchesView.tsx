import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Building2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
      <header className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">Matches</h1>
          <p className="font-body text-sm text-muted-foreground">
            {matches.length === 0
              ? "When a recruiter likes you back, the conversation starts here."
              : `${matches.length} mutual match${matches.length !== 1 ? "es" : ""} - open a thread to keep momentum.`}
          </p>
        </div>
        {withChat > 0 ? (
          <Button asChild>
            <Link href="/chat">Open inbox</Link>
          </Button>
        ) : null}
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Applied", value: appliedCount },
          { label: "Matches", value: matches.length },
          { label: "Match rate", value: `${matchRate}%` },
          { label: "Active chats", value: withChat },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="p-4 pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {appliedCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your pipeline</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-x-6 gap-y-4">
            {[
              { label: "Applied", value: appliedCount },
              { label: "Saved", value: savedCount },
              { label: "Matched", value: matches.length },
              { label: "In chat", value: withChat },
            ].map(({ label, value }) => (
              <div key={label} className="min-w-[4.5rem]">
                <p className="font-heading text-lg font-semibold tabular-nums text-foreground">{value}</p>
                <p className="font-body mt-0.5 text-[11px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!matches.length ? (
        <Card className="px-6 py-14 text-center">
          <CardHeader>
            <CardTitle>No matches yet</CardTitle>
            <CardDescription className="mx-auto max-w-md">
              A match happens when you apply and the recruiter returns interest. Strong profiles get there faster.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="mx-auto max-w-md list-inside list-decimal space-y-2 text-left font-body text-sm text-muted-foreground">
              <li>Finish your profile - bio, skills, and education.</li>
              <li>Add a resume or portfolio link if you have one.</li>
              <li>Apply to roles that fit; quality beats volume.</li>
            </ol>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild variant="outline">
                <Link href="/onboarding">Complete profile</Link>
              </Button>
              <Button asChild>
                <Link href="/discover">Discover jobs</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="font-body text-sm text-muted-foreground">Select a match to open your chat.</p>
          <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 lg:grid-cols-2">
            {matches.map((match) => {
              const job = match.jobs
              const company = job?.recruiter_profiles
              const convId = Array.isArray(match.conversations)
                ? match.conversations?.[0]?.id
                : match.conversations?.id

              const inner = (
                <Card className={convId ? "h-full transition hover:border-primary/30" : "h-full opacity-95"}>
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted ring-1 ring-border">
                      {company?.logo_url ? (
                        <img src={company.logo_url} className="h-full w-full object-cover" alt="" />
                      ) : (
                        <Building2 className="h-7 w-7 text-muted-foreground" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate font-heading text-base font-semibold text-foreground">{job?.title}</p>
                      <p className="truncate font-body text-sm text-muted-foreground">{company?.company_name}</p>
                      <p className="mt-1 font-body text-xs text-muted-foreground">{formatDate(match.created_at)}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge>Matched</Badge>
                        <Badge variant="outline">{convId ? "Chat ready" : "Chat pending"}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )

              return (
                <li key={match.id}>
                  {convId ? (
                    <Link href={`/chat/${convId}`} className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
