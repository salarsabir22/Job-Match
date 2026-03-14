import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { Building2 } from "lucide-react"
import { ApproveButton } from "./ApproveButton"

export default async function AdminRecruitersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: currentProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (currentProfile?.role !== "admin") redirect("/discover")

  const { data: recruiters } = await supabase
    .from("recruiter_profiles")
    .select("*, profiles(full_name, avatar_url, created_at)")
    .order("created_at", { ascending: false })

  const pending = recruiters?.filter(r => !r.is_approved).length || 0

  return (
    <div className="space-y-5 p-4 max-w-4xl bg-[#030304] min-h-screen">
      <div>
        <h1 className="font-heading font-bold text-2xl text-white">Recruiter Approvals</h1>
        <p className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8] mt-0.5">{pending} pending</p>
      </div>

      {pending > 0 && (
        <div className="p-4 rounded-xl bg-[#F7931A]/10 border border-[#F7931A]/25">
          <p className="font-data text-[11px] tracking-widest uppercase text-[#F7931A]">
            {pending} recruiter{pending > 1 ? "s" : ""} awaiting approval
          </p>
        </div>
      )}

      <div className="space-y-3">
        {!recruiters?.length ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-[#F7931A]/15 border border-[#F7931A]/30 flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-7 w-7 text-[#F7931A]" />
            </div>
            <p className="font-body text-[#94A3B8] text-sm">No recruiter profiles yet</p>
          </div>
        ) : recruiters.map((recruiter) => (
          <div key={recruiter.id} className="rounded-xl bg-[#0F1115] border border-white/8 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center shrink-0 shadow-[0_0_12px_-3px_rgba(247,147,26,0.4)]">
                  {recruiter.logo_url ? (
                    <img src={recruiter.logo_url} className="h-full w-full rounded-xl object-cover" alt="" />
                  ) : (
                    <Building2 className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  <p className="font-heading font-semibold text-white">{recruiter.company_name}</p>
                  <p className="font-body text-sm text-[#94A3B8]">{(recruiter.profiles as any)?.full_name}</p>
                  <p className="font-data text-[10px] text-[#94A3B8]">Joined {formatDate((recruiter.profiles as any)?.created_at)}</p>
                </div>
              </div>
              <span className={`flex-shrink-0 font-data text-[9px] tracking-widest uppercase px-2 py-1 rounded-full border ${
                recruiter.is_approved
                  ? "bg-green-500/15 border-green-500/30 text-green-400"
                  : "bg-[#FFD600]/10 border-[#FFD600]/25 text-[#FFD600]"
              }`}>
                {recruiter.is_approved ? "Approved" : "Pending"}
              </span>
            </div>
            {recruiter.description && (
              <p className="font-body text-sm text-[#94A3B8]">{recruiter.description}</p>
            )}
            <ApproveButton recruiterId={recruiter.id} isApproved={recruiter.is_approved} />
          </div>
        ))}
      </div>
    </div>
  )
}
