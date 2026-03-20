import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Bookmark, MapPin, Wifi, Calendar, Building2 } from "lucide-react"

export default async function SavedJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: saved } = await supabase
    .from("job_swipes")
    .select("*, jobs(*, recruiter_profiles(company_name, logo_url))")
    .eq("student_id", user.id)
    .eq("direction", "saved")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-3xl text-white">Saved Jobs</h1>
        <p className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8] mt-0.5">{saved?.length || 0} saved</p>
      </div>

      {!saved?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#D4D4D4]/10 border border-[#D4D4D4]/25 flex items-center justify-center">
            <Bookmark className="h-8 w-8 text-[#D4D4D4]" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-lg text-white">No saved jobs</h3>
            <p className="font-body text-sm text-[#94A3B8] mt-1 max-w-[220px]">Bookmark jobs while swiping to review them later</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {(saved as any[]).map((swipe) => {
            const job = swipe.jobs
            const company = job?.recruiter_profiles
            return (
              <div key={swipe.id} className="rounded-xl bg-[#0F1115] border border-white/8 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#525252] to-[#FAFAFA] flex items-center justify-center shrink-0 shadow-[0_0_10px_-3px_rgba(255,255,255,0.4)]">
                    {company?.logo_url ? (
                      <img src={company.logo_url} className="h-full w-full rounded-xl object-cover" alt="" />
                    ) : (
                      <Building2 className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-sm text-white truncate">{job?.title}</p>
                    <p className="font-body text-xs text-[#94A3B8]">{company?.company_name}</p>
                  </div>
                  <Bookmark className="h-4 w-4 text-[#D4D4D4] shrink-0" fill="currentColor" />
                </div>
                <div className="flex flex-wrap gap-3 font-data text-[10px] tracking-wider text-[#94A3B8]">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{job?.job_type?.replace("_", " ")}</span>
                  {job?.is_remote ? (
                    <span className="flex items-center gap-1"><Wifi className="h-3.5 w-3.5 text-[#FAFAFA]" />Remote</span>
                  ) : job?.location ? (
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                  ) : null}
                </div>
                {job?.required_skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {job.required_skills.slice(0, 4).map((s: string) => (
                      <span key={s} className="font-data text-[9px] tracking-wider px-2 py-0.5 rounded-full bg-[#FAFAFA]/10 border border-[#FAFAFA]/20 text-[#FAFAFA]">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
