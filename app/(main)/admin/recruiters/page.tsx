import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { Building2 } from "lucide-react"
import { ApproveButton } from "./ApproveButton"

type ProfileEmbed = { full_name?: string | null; created_at?: string }

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
    <div className="space-y-5 p-4 max-w-4xl bg-white min-h-screen">
      <div>
        <h1 className="font-heading font-bold text-2xl text-black">Recruiter Approvals</h1>
        <p className="font-data text-[11px] tracking-wider uppercase text-neutral-700 mt-0.5">{pending} pending</p>
      </div>

      {pending > 0 && (
        <div className="p-4 rounded-xl bg-[#FAFAFA]/10 border border-[#FAFAFA]/25">
          <p className="font-data text-[11px] tracking-widest uppercase text-neutral-900">
            {pending} recruiter{pending > 1 ? "s" : ""} awaiting approval
          </p>
        </div>
      )}

      <div className="space-y-3">
        {!recruiters?.length ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-[#FAFAFA]/15 border border-[#FAFAFA]/30 flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-7 w-7 text-neutral-900" />
            </div>
            <p className="font-body text-neutral-700 text-sm">No recruiter profiles yet</p>
          </div>
        ) : recruiters.map((recruiter) => (
          <div key={recruiter.id} className="rounded-xl bg-white border border-black/10 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-neutral-200 flex items-center justify-center shrink-0 shadow-[0_0_12px_-3px_rgba(255,255,255,0.4)]">
                  {recruiter.logo_url ? (
                    <img src={recruiter.logo_url} className="h-full w-full rounded-xl object-cover" alt="" />
                  ) : (
                    <Building2 className="h-6 w-6 text-black" />
                  )}
                </div>
                <div>
                  <p className="font-heading font-semibold text-black">{recruiter.company_name}</p>
                  <p className="font-body text-sm text-neutral-700">{(recruiter.profiles as ProfileEmbed | null)?.full_name}</p>
                  <p className="font-data text-[10px] text-neutral-700">
                    Joined{" "}
                    {(() => {
                      const p = recruiter.profiles as ProfileEmbed | null
                      return p?.created_at ? formatDate(p.created_at) : "—"
                    })()}
                  </p>
                </div>
              </div>
              <span className={`flex-shrink-0 font-data text-[9px] tracking-widest uppercase px-2 py-1 rounded-full border ${
                recruiter.is_approved
                  ? "bg-neutral-500/15 border-neutral-500/30 text-neutral-400"
                  : "bg-[#D4D4D4]/10 border-[#D4D4D4]/25 text-[#D4D4D4]"
              }`}>
                {recruiter.is_approved ? "Approved" : "Pending"}
              </span>
            </div>
            {recruiter.description && (
              <p className="font-body text-sm text-neutral-700">{recruiter.description}</p>
            )}
            <ApproveButton recruiterId={recruiter.id} isApproved={recruiter.is_approved} />
          </div>
        ))}
      </div>
    </div>
  )
}
