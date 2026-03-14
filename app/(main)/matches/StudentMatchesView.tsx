import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Heart, MessageCircle, Building2, Zap, ArrowRight, Target, TrendingUp, Clock } from "lucide-react"
import { formatDate } from "@/lib/utils"

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

  const matches = matchesRes.data || []
  const appliedCount = appliedRes.count || 0
  const savedCount = savedRes.count || 0
  const matchRate = appliedCount > 0 ? Math.round((matches.length / appliedCount) * 100) : 0
  const withChat = matches.filter(m => (m as any).conversations?.length > 0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-3xl text-white">Matches</h1>
        <p className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8] mt-0.5">
          {matches.length} mutual match{matches.length !== 1 ? "es" : ""}
        </p>
      </div>

      {/* Analytics stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Applied", value: appliedCount, icon: Zap, color: "#F7931A" },
          { label: "Matches", value: matches.length, icon: Heart, color: "#EA580C" },
          { label: "Match Rate", value: `${matchRate}%`, icon: Target, color: "#FFD600" },
          { label: "Active Chats", value: withChat, icon: MessageCircle, color: "#22c55e" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl bg-[#0F1115] border border-white/8 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-data text-[9px] tracking-wider uppercase text-[#94A3B8]">{label}</p>
              <Icon className="h-3.5 w-3.5" style={{ color }} />
            </div>
            <p className="font-heading font-bold text-2xl" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Conversion funnel */}
      {appliedCount > 0 && (
        <div className="rounded-xl bg-[#0F1115] border border-white/8 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-[#F7931A]" />
            <p className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8]">Your Job Search Funnel</p>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { label: "Applied", value: appliedCount, color: "#94A3B8" },
              { label: "Saved", value: savedCount, color: "#FFD600" },
              { label: "Matched", value: matches.length, color: "#F7931A" },
              { label: "In Chat", value: withChat, color: "#22c55e" },
            ].map(({ label, value, color }, i, arr) => (
              <div key={label} className="flex items-center gap-2 shrink-0">
                <div className="text-center">
                  <p className="font-heading font-bold text-xl" style={{ color }}>{value}</p>
                  <p className="font-data text-[9px] tracking-wider uppercase text-[#94A3B8]">{label}</p>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-[#94A3B8]/40 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!matches.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-[#F7931A]/15 border border-[#F7931A]/30 flex items-center justify-center">
            <Heart className="h-10 w-10 text-[#F7931A]" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-xl text-white">No matches yet</h3>
            <p className="font-body text-sm text-[#94A3B8] mt-1 max-w-xs">
              Matches appear when a recruiter likes your profile back. Keep swiping on relevant jobs!
            </p>
          </div>

          {/* Next steps */}
          <div className="w-full max-w-sm rounded-xl bg-[#0F1115] border border-white/8 p-5 text-left space-y-3">
            <p className="font-data text-[10px] tracking-widest uppercase text-[#94A3B8]">Next steps to get matched</p>
            {[
              { icon: Zap, color: "#F7931A", text: "Complete your profile — recruiters see your bio and skills" },
              { icon: Target, color: "#FFD600", text: "Add your university and degree to stand out" },
              { icon: TrendingUp, color: "#22c55e", text: "Upload a resume to boost your match rate significantly" },
            ].map(({ icon: Icon, color, text }, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color }} />
                <p className="font-body text-xs text-[#94A3B8]">{text}</p>
              </div>
            ))}
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 font-body text-xs text-[#F7931A] hover:text-[#FFD600] transition-colors mt-1"
            >
              Complete Profile <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <Link
            href="/discover"
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#EA580C] to-[#F7931A] text-white font-body font-semibold text-sm shadow-[0_0_20px_-5px_rgba(234,88,12,0.5)] hover:shadow-[0_0_30px_-5px_rgba(247,147,26,0.7)] transition-all duration-300"
          >
            <Zap className="h-4 w-4" />Discover Jobs
          </Link>
        </div>
      ) : (
        <>
          <p className="font-data text-[10px] tracking-widest uppercase text-[#94A3B8]">
            {matches.length} match{matches.length !== 1 ? "es" : ""} — click to open a chat
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(matches as any[]).map((match) => {
              const job = match.jobs
              const company = job?.recruiter_profiles
              const convId = match.conversations?.[0]?.id
              return (
                <Link key={match.id} href={convId ? `/chat/${convId}` : "#"}>
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#0F1115] border border-white/8 hover:border-[#F7931A]/30 hover:shadow-[0_0_25px_-8px_rgba(247,147,26,0.2)] transition-all duration-300 h-full cursor-pointer">
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
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="h-3 w-3 text-[#94A3B8]" />
                        <p className="font-data text-[10px] text-[#94A3B8]">{formatDate(match.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="font-data text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-[#F7931A]/15 border border-[#F7931A]/30 text-[#F7931A]">
                          ✓ Matched
                        </span>
                        {convId ? (
                          <span className="flex items-center gap-1 font-data text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-400">
                            <MessageCircle className="h-3 w-3" />Chat open
                          </span>
                        ) : (
                          <span className="font-data text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#94A3B8]">
                            Awaiting chat
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
