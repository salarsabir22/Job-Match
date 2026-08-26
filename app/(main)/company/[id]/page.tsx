import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Building2, Globe, Users, Briefcase } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ShareButton } from "@/components/share/ShareButton"
import { formatDate } from "@/lib/utils"
import type { Job } from "@/types"

export default async function CompanyPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: company } = await supabase.from("recruiter_profiles").select("*").eq("id", id).maybeSingle()
  if (!company) notFound()

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("recruiter_id", id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  const listings = (jobs || []) as Job[]

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-data text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Company</p>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight">{company.company_name}</h1>
        </div>
        <ShareButton path={`/company/${id}`} title={company.company_name} />
      </div>

      <Card className="shadow-sm">
        <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
            {company.logo_url ? (
              <img src={company.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {company.industry ? <Badge variant="secondary">{company.industry}</Badge> : null}
            {company.employee_count ? (
              <Badge variant="outline" className="gap-1 font-normal">
                <Users className="h-3 w-3" />
                {company.employee_count} people
              </Badge>
            ) : null}
          </div>
          {company.website_url ? (
            <a
              href={company.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-body text-sm text-primary underline-offset-4 hover:underline"
            >
              <Globe className="h-4 w-4" />
              Website
            </a>
          ) : null}
        </CardContent>
      </Card>

      {company.description ? (
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <h2 className="mb-2 font-data text-[10px] uppercase tracking-wide text-muted-foreground">About</h2>
            <p className="font-body text-sm leading-relaxed">{company.description}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        <h2 className="font-heading text-sm font-semibold">Open roles</h2>
        {listings.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">No live roles right now.</p>
        ) : (
          listings.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="block">
              <Card className="transition hover:border-primary/30">
                <CardContent className="flex items-start gap-3 p-4">
                  <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="font-heading text-sm font-semibold">{job.title}</p>
                    <p className="mt-0.5 font-body text-xs text-muted-foreground">
                      {job.job_type.replace(/_/g, " ")}
                      {job.is_remote ? " · Remote" : job.location ? ` · ${job.location}` : ""}
                      {" · "}
                      {formatDate(job.created_at)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
