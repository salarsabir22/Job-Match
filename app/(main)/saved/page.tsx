import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Bookmark,
  Building2,
  Calendar,
  MapPin,
  Sparkles,
  Wifi,
} from "lucide-react"
import { DiscoverHeader, DiscoverStatStrip } from "@/components/discover"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SavedJobActions } from "@/components/saved/SavedJobActions"
import { formatDate } from "@/lib/utils"
import type { Job, RecruiterProfile } from "@/types"
import { cn } from "@/lib/utils"

type SavedSwipeRow = {
  id: string
  created_at: string
  jobs: (Job & { recruiter_profiles?: RecruiterProfile | RecruiterProfile[] | null }) | null
}

function formatJobType(raw: string) {
  return raw.replace(/_/g, " ")
}

function companyName(job: SavedSwipeRow["jobs"]) {
  const rp = job?.recruiter_profiles
  if (!rp) return null
  return Array.isArray(rp) ? rp[0]?.company_name : rp.company_name
}

function companyLogo(job: SavedSwipeRow["jobs"]) {
  const rp = job?.recruiter_profiles
  if (!rp) return null
  return Array.isArray(rp) ? rp[0]?.logo_url : rp.logo_url
}

export default async function SavedJobsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role === "recruiter") redirect("/jobs")

  const { data: saved } = await supabase
    .from("job_swipes")
    .select("*, jobs(*, recruiter_profiles(company_name, logo_url))")
    .eq("student_id", user.id)
    .eq("direction", "saved")
    .order("created_at", { ascending: false })

  const rows = (saved || []) as SavedSwipeRow[]
  const total = rows.length
  const activeOpen = rows.filter((r) => r.jobs?.is_active).length
  const remoteCount = rows.filter((r) => r.jobs?.is_remote).length
  const companies = new Set(
    rows.map((r) => companyName(r.jobs)).filter((n): n is string => !!n?.trim())
  ).size

  return (
    <div className="space-y-10">
      <DiscoverHeader
        eyebrow="Bookmarks"
        title="Saved jobs"
        description={
          <>
            Roles you saved while swiping — compare details, then open a listing to apply or learn more about the
            team.
          </>
        }
        action={
          <Button asChild className="rounded-full">
            <Link href="/discover">Discover more</Link>
          </Button>
        }
      />

      {total > 0 ? (
        <DiscoverStatStrip
          columns={4}
          caption="Your saved list"
          items={[
            { label: "Saved", value: total },
            { label: "Still open", value: activeOpen, sub: total ? `${Math.round((activeOpen / total) * 100)}% of list` : undefined },
            { label: "Remote-friendly", value: remoteCount },
            { label: "Companies", value: companies },
          ]}
        />
      ) : null}

      {!total ? (
        <Card className="border-dashed border-border bg-muted/20 shadow-none">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center sm:py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5">
              <Bookmark className="h-8 w-8 text-primary" strokeWidth={1.5} />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="font-heading text-lg font-semibold text-foreground">No saved jobs yet</h2>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">
                Swipe in Discover and tap the bookmark on roles you want to revisit. They&apos;ll show up here with full
                detail and a quick path to apply.
              </p>
            </div>
            <Button asChild className="rounded-full">
              <Link href="/discover">Go to Discover</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((swipe) => {
            const job = swipe.jobs
            if (!job) return null
            const company = companyName(job)
            const logo = companyLogo(job)
            const desc = job.description?.trim()
            const skills = job.required_skills ?? []
            const nice = job.nice_to_have_skills ?? []

            return (
              <Card
                key={swipe.id}
                className="overflow-hidden border-border shadow-sm transition-colors hover:border-primary/25"
              >
                <CardHeader className="space-y-4 pb-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 flex-1 gap-4">
                      <div
                        className={cn(
                          "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/50",
                          job.is_active && "ring-1 ring-primary/10"
                        )}
                      >
                        {logo ? (
                          <img src={logo} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Building2 className="h-7 w-7 text-muted-foreground" strokeWidth={1.25} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 space-y-1">
                            <CardTitle className="font-heading text-lg font-semibold leading-snug text-foreground sm:text-xl">
                              {job.title}
                            </CardTitle>
                            <CardDescription className="font-body text-sm text-muted-foreground">
                              {company ?? "Company"}
                            </CardDescription>
                          </div>
                          <Bookmark className="h-5 w-5 shrink-0 fill-primary text-primary" aria-hidden />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={job.is_active ? "default" : "secondary"} className="font-data text-[10px] uppercase tracking-wide">
                            {job.is_active ? "Open" : "Closed"}
                          </Badge>
                          <Badge variant="outline" className="font-normal">
                            {formatJobType(job.job_type)}
                          </Badge>
                          {job.is_remote ? (
                            <Badge variant="outline" className="gap-1 font-normal border-primary/25 text-primary">
                              <Wifi className="h-3 w-3" />
                              Remote
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {desc ? (
                    <p className="font-body text-sm leading-relaxed text-muted-foreground line-clamp-4">{desc}</p>
                  ) : (
                    <p className="font-body text-sm italic text-muted-foreground/80">No description provided.</p>
                  )}

                  <div className="flex flex-wrap gap-x-5 gap-y-2 font-body text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-primary/80" />
                      {formatJobType(job.job_type)}
                    </span>
                    {job.is_remote ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Wifi className="h-3.5 w-3.5 shrink-0 text-primary/80" />
                        Remote
                      </span>
                    ) : job.location ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/80" />
                        {job.location}
                      </span>
                    ) : null}
                  </div>

                  {(skills.length > 0 || nice.length > 0) && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        {skills.length > 0 ? (
                          <div>
                            <p className="font-data mb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                              Required skills
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {skills.map((s: string) => (
                                <span
                                  key={s}
                                  className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 font-data text-[10px] tracking-wide text-primary"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {nice.length > 0 ? (
                          <div>
                            <p className="font-data mb-2 flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                              <Sparkles className="h-3 w-3" />
                              Nice to have
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {nice.slice(0, 8).map((s: string) => (
                                <span
                                  key={s}
                                  className="rounded-full border border-border bg-muted/40 px-2.5 py-1 font-data text-[10px] text-muted-foreground"
                                >
                                  {s}
                                </span>
                              ))}
                              {nice.length > 8 ? (
                                <span className="text-[10px] text-muted-foreground">+{nice.length - 8}</span>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </>
                  )}
                </CardContent>

                <CardFooter className="flex flex-col gap-4 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-data shrink-0 text-[11px] text-muted-foreground">
                    Saved <span className="tabular-nums text-foreground/90">{formatDate(swipe.created_at)}</span>
                  </p>
                  <SavedJobActions
                    swipeId={swipe.id}
                    jobId={job.id}
                    jobTitle={job.title}
                    userId={user.id}
                    isActive={job.is_active}
                  />
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
