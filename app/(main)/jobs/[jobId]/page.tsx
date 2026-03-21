import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import type { Job, RecruiterProfile } from "@/types"
import { RecruiterJobDetail } from "./RecruiterJobDetail"
import { StudentJobDetailView } from "./StudentJobDetailView"

type JobWithCompany = Job & { recruiter_profiles?: RecruiterProfile | RecruiterProfile[] | null }

type JobDetailRecord = Omit<Job, "recruiter_profiles"> & { recruiter_profiles: RecruiterProfile | null }

function normalizeJob(job: JobWithCompany): JobDetailRecord {
  const rp = job.recruiter_profiles
  const company: RecruiterProfile | null = Array.isArray(rp) ? (rp[0] ?? null) : (rp ?? null)
  const { recruiter_profiles: _ignored, ...rest } = job
  return { ...rest, recruiter_profiles: company } as JobDetailRecord
}

export default async function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  const { data: job, error } = await supabase
    .from("jobs")
    .select("*, recruiter_profiles(id, company_name, logo_url, website_url, description, is_approved)")
    .eq("id", jobId)
    .single()

  if (error || !job) notFound()

  const row = normalizeJob(job as JobWithCompany)
  const isOwner = row.recruiter_id === user.id
  const company = row.recruiter_profiles

  if (profile?.role === "recruiter") {
    if (!isOwner) notFound()
    return <RecruiterJobDetail job={row} jobId={jobId} userId={user.id} />
  }

  const listingVisible = row.is_active && company?.is_approved === true
  if (!listingVisible) notFound()

  return <StudentJobDetailView job={row} userId={user.id} />
}
