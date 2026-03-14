import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Heart, MessageCircle, Building2 } from "lucide-react"
import { formatDate } from "@/lib/utils"

export async function StudentMatchesView({ userId }: { userId: string }) {
  const supabase = await createClient()
  const { data: matches } = await supabase
    .from("matches")
    .select("*, jobs(title, job_type, recruiter_profiles(company_name, logo_url)), conversations(id)")
    .eq("student_id", userId)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-3xl text-white">Matches</h1>
        <p className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8] mt-0.5">{matches?.length || 0} mutual matches</p>
      </div>

      {!matches?.length ? (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-[#F7931A]/15 border border-[#F7931A]/30 flex items-center justify-center">
            <Heart className="h-10 w-10 text-[#F7931A]" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-xl text-white">No matches yet</h3>
            <p className="font-body text-sm text-[#94A3B8] mt-1 max-w-xs">Keep swiping! Matches appear when recruiters like you back.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(matches as any[]).map((match) => {
            const job = match.jobs
            const company = job?.recruiter_profiles
            const convId = match.conversations?.[0]?.id
            return (
              <Link key={match.id} href={convId ? `/chat/${convId}` : "#"}>
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#0F1115] border border-white/8 hover:border-[#F7931A]/30 hover:shadow-[0_0_25px_-8px_rgba(247,147,26,0.2)] transition-all duration-300 h-full">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center shrink-0 shadow-[0_0_15px_-3px_rgba(247,147,26,0.5)]">
                    {company?.logo_url ? (
                      <img src={company.logo_url} className="h-full w-full rounded-2xl object-cover" alt="" />
                    ) : (
                      <Building2 className="h-7 w-7 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-base text-white truncate">{job?.title}</p>
                    <p className="font-body text-sm text-[#94A3B8]">{company?.company_name}</p>
                    <p className="font-data text-[10px] text-[#94A3B8] mt-1">{formatDate(match.created_at)}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="font-data text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-[#F7931A]/15 border border-[#F7931A]/30 text-[#F7931A]">
                        Matched
                      </span>
                      {convId && (
                        <span className="flex items-center gap-1 font-data text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#94A3B8]">
                          <MessageCircle className="h-3 w-3" /> Chat
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
