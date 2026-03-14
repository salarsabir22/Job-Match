import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, MapPin, Wifi, Calendar, Briefcase } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default async function JobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "recruiter") redirect("/discover")

  const { data: jobs } = await supabase.from("jobs").select("*").eq("recruiter_id", user.id).order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-white">My Jobs</h1>
          <p className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8] mt-0.5">{jobs?.length || 0} postings</p>
        </div>
        <Link href="/jobs/new"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#EA580C] to-[#F7931A] text-white font-body font-semibold text-xs shadow-[0_0_15px_-5px_rgba(234,88,12,0.5)] hover:shadow-[0_0_25px_-5px_rgba(247,147,26,0.7)] transition-all duration-300">
          <Plus className="h-3.5 w-3.5" />Post Job
        </Link>
      </div>

      {!jobs?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#F7931A]/15 border border-[#F7931A]/30 flex items-center justify-center">
            <Briefcase className="h-8 w-8 text-[#F7931A]" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-lg text-white">No jobs posted yet</h3>
            <p className="font-body text-sm text-[#94A3B8] mt-1 max-w-[220px]">Post your first job to start finding great candidates</p>
          </div>
          <Link href="/jobs/new"
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#EA580C] to-[#F7931A] text-white font-body font-semibold text-sm shadow-[0_0_20px_-5px_rgba(234,88,12,0.5)] hover:shadow-[0_0_30px_-5px_rgba(247,147,26,0.7)] transition-all duration-300">
            <Plus className="h-4 w-4" />Post Your First Job
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(jobs as any[]).map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <div className="rounded-xl bg-[#0F1115] border border-white/8 p-4 hover:border-[#F7931A]/30 hover:shadow-[0_0_20px_-8px_rgba(247,147,26,0.2)] transition-all duration-300 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading font-semibold text-base text-white leading-tight">{job.title}</h3>
                  <span className={`flex-shrink-0 font-data text-[9px] tracking-widest uppercase px-2 py-1 rounded-full border ${
                    job.is_active
                      ? "bg-[#F7931A]/15 border-[#F7931A]/30 text-[#F7931A]"
                      : "bg-white/5 border-white/15 text-[#94A3B8]"
                  }`}>
                    {job.is_active ? "Active" : "Paused"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 font-data text-[10px] tracking-wider text-[#94A3B8]">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{job.job_type.replace("_", " ")}</span>
                  {job.is_remote ? (
                    <span className="flex items-center gap-1"><Wifi className="h-3.5 w-3.5 text-[#F7931A]" />Remote</span>
                  ) : job.location ? (
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                  ) : null}
                </div>
                {job.required_skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {job.required_skills.slice(0, 4).map((s: string) => (
                      <span key={s} className="font-data text-[9px] tracking-wider px-2 py-0.5 rounded-full bg-[#F7931A]/10 border border-[#F7931A]/20 text-[#F7931A]">{s}</span>
                    ))}
                    {job.required_skills.length > 4 && (
                      <span className="font-data text-[9px] tracking-wider px-2 py-0.5 rounded-full border border-white/10 text-[#94A3B8]">+{job.required_skills.length - 4}</span>
                    )}
                  </div>
                )}
                <p className="font-data text-[10px] text-[#94A3B8]">Posted {formatDate(job.created_at)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
