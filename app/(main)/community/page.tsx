import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Hash, Users, MessageCircle } from "lucide-react"

export default async function CommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: channels } = await supabase
    .from("community_channels").select("*, channel_members(user_id)").order("name")

  const { data: memberships } = await supabase
    .from("channel_members").select("channel_id").eq("user_id", user.id)

  const joinedIds = new Set(memberships?.map(m => m.channel_id) || [])

  const byCategory = (channels || []).reduce((acc: Record<string, any[]>, ch) => {
    const cat = ch.category || "general"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(ch)
    return acc
  }, {})

  const categoryColors: Record<string, string> = {
    tech: "#F7931A", design: "#FFD600", finance: "#EA580C",
    marketing: "#F7931A", data: "#FFD600", startup: "#EA580C", general: "#F7931A",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-3xl text-white">Community</h1>
        <p className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8] mt-0.5">Join channels to connect with peers</p>
      </div>

      {Object.entries(byCategory).map(([category, chans]) => {
        const accent = categoryColors[category] || "#F7931A"
        return (
          <div key={category} className="space-y-3">
            <h2 className="font-data text-[11px] tracking-widest uppercase px-1 flex items-center gap-2" style={{ color: accent }}>
              <span className="h-px flex-1 opacity-20" style={{ background: accent }} />
              {category}
              <span className="h-px flex-1 opacity-20" style={{ background: accent }} />
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {chans.map((channel) => {
                const memberCount = channel.channel_members?.length || 0
                const isJoined = joinedIds.has(channel.id)
                return (
                  <Link key={channel.id} href={`/community/${channel.id}`}>
                    <div className="flex items-start gap-3 p-5 rounded-2xl bg-[#0F1115] border border-white/8 hover:border-[#F7931A]/30 hover:shadow-[0_0_20px_-8px_rgba(247,147,26,0.2)] transition-all duration-300 h-full">
                      <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
                        <Hash className="h-5 w-5" style={{ color: accent }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-heading font-semibold text-sm text-white">#{channel.name}</p>
                          {isJoined && (
                            <span className="font-data text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded-full bg-[#F7931A]/15 border border-[#F7931A]/30 text-[#F7931A]">
                              Joined
                            </span>
                          )}
                        </div>
                        {channel.description && (
                          <p className="font-body text-xs text-[#94A3B8] mt-1 line-clamp-2">{channel.description}</p>
                        )}
                        <div className="flex items-center gap-1 mt-2 font-data text-[10px] text-[#94A3B8]">
                          <Users className="h-3 w-3" />{memberCount} members
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}

      {!channels?.length && (
        <div className="text-center py-32">
          <div className="w-16 h-16 rounded-2xl bg-[#F7931A]/15 border border-[#F7931A]/30 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-8 w-8 text-[#F7931A]" />
          </div>
          <p className="font-heading font-semibold text-white mb-1">No channels yet</p>
          <p className="font-body text-sm text-[#94A3B8]">Ask an admin to create some channels.</p>
        </div>
      )}
    </div>
  )
}
