import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Building2, Globe, Users, Briefcase, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShareButton } from "@/components/share/ShareButton"
import { ReportBlockMenu } from "@/components/moderation/ReportBlockMenu"
import { formatDate } from "@/lib/utils"
import { formatSalary } from "@/lib/jobs/salary"
import type { Job, UserRole } from "@/types"
import { ProfilePosts } from "@/components/feed/ProfilePosts"
import { profileSharePath } from "@/lib/share/profile-path"

export default async function CompanyPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: company } = await supabase.from("recruiter_profiles").select("*").eq("id", id).maybeSingle()
  if (!company) notFound()

  const [{ data: jobs }, { data: viewer }] = await Promise.all([
    supabase
      .from("jobs")
      .select("*")
      .eq("recruiter_id", id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    user
      ? supabase.from("profiles").select("id, role, full_name, avatar_url, bio").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const listings = (jobs || []) as Job[]
  const isStudent = viewer?.role === "student"
  const meta = [company.industry, company.employee_count ? `${company.employee_count} people` : null].filter(Boolean)

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="relative h-36 sm:h-44">
          {company.logo_url ? (
            <>
              <img
                src={company.logo_url}
                alt=""
                className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-40"
              />
              <div className="absolute inset-0 bg-[#1d1d1f]/55" />
            </>
          ) : (
            <div className="apple-vibrancy-header absolute inset-0" />
          )}
        </div>
        <div className="relative px-5 pb-5 sm:px-8">
          <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background shadow-md sm:h-24 sm:w-24">
                {company.logo_url ? (
                  <img src={company.logo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 pb-1">
                <p className="font-data text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Company</p>
                <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                  {company.company_name}
                </h1>
                {meta.length > 0 ? (
                  <p className="mt-1 font-body text-sm text-muted-foreground">{meta.join(" · ")}</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pb-1">
              <ShareButton path={`/company/${id}`} title={company.company_name} label="Share" />
              {user && user.id !== id ? (
                <ReportBlockMenu currentUserId={user.id} peerId={id} peerName={company.company_name} />
              ) : null}
              {!user ? (
                <Button asChild size="sm" className="rounded-full">
                  <Link href={`/login?next=${encodeURIComponent(`/company/${id}`)}`}>Sign in</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17.5rem]">
        <div className="min-w-0 space-y-6">
          {company.description ? (
            <section>
              <h2 className="mb-2 font-heading text-base font-semibold">About</h2>
              <p className="font-body text-sm leading-relaxed text-muted-foreground">{company.description}</p>
            </section>
          ) : null}

          {company.hiring_focus ? (
            <section>
              <h2 className="mb-2 font-heading text-base font-semibold">Hiring focus</h2>
              <p className="font-body text-sm leading-relaxed text-muted-foreground">{company.hiring_focus}</p>
            </section>
          ) : null}

          <ProfilePosts
            profileUserId={id}
            headline={[company.company_name, company.industry].filter(Boolean).join(" · ") || "Recruiter"}
            currentUser={
              user && viewer
                ? {
                    id: user.id,
                    fullName: viewer.full_name || "You",
                    avatarUrl: viewer.avatar_url,
                    role: (viewer.role as UserRole) || "student",
                    headline: null,
                    bio: viewer.bio,
                    profilePath: profileSharePath(viewer.role, user.id),
                  }
                : null
            }
          />

          <section className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-heading text-base font-semibold">Open roles</h2>
              <p className="font-body text-xs text-muted-foreground">
                {listings.length} live listing{listings.length === 1 ? "" : "s"}
              </p>
            </div>
            {listings.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground">No live roles right now.</p>
            ) : (
              <ul className="m-0 list-none space-y-2 p-0">
                {listings.map((job) => {
                  const pay = formatSalary({
                    min: job.salary_min,
                    max: job.salary_max,
                    currency: job.salary_currency,
                    note: job.compensation_note,
                  })
                  const place = job.is_remote ? "Remote" : job.location
                  return (
                    <li key={job.id}>
                      <Card className="transition hover:border-primary/30">
                        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                          <Briefcase className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
                          <div className="min-w-0 flex-1">
                            <p className="font-heading text-sm font-semibold">{job.title}</p>
                            <p className="mt-0.5 font-body text-xs text-muted-foreground">
                              {job.job_type.replace(/_/g, " ")}
                              {place ? ` · ${place}` : ""}
                              {pay ? ` · ${pay}` : ""}
                              {" · "}
                              {formatDate(job.created_at)}
                            </p>
                          </div>
                          <Button asChild size="sm" variant={isStudent ? "default" : "outline"} className="shrink-0 rounded-full">
                            <Link href={`/jobs/${job.id}`}>{isStudent ? "Apply" : "Open listing"}</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:pt-1">
          <Card>
            <CardContent className="space-y-3 p-5">
              <h2 className="font-heading text-sm font-semibold">Details</h2>
              {company.industry ? (
                <p className="flex items-start gap-2 font-body text-sm text-muted-foreground">
                  <Briefcase className="mt-0.5 h-4 w-4 shrink-0" />
                  {company.industry}
                </p>
              ) : null}
              {company.employee_count ? (
                <p className="flex items-start gap-2 font-body text-sm text-muted-foreground">
                  <Users className="mt-0.5 h-4 w-4 shrink-0" />
                  {company.employee_count} people
                </p>
              ) : null}
              {listings.some((j) => j.location || j.is_remote) ? (
                <p className="flex items-start gap-2 font-body text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  {listings.find((j) => j.is_remote) ? "Remote roles available" : listings.find((j) => j.location)?.location}
                </p>
              ) : null}
              {company.website_url ? (
                <a
                  href={company.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-body text-sm text-primary underline-offset-4 hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </a>
              ) : null}
              {!company.industry && !company.employee_count && !company.website_url ? (
                <p className="font-body text-sm text-muted-foreground">No extra details yet.</p>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
