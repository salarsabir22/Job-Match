import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Hash, Users, MessageCircle, TrendingUp, Zap, CheckCircle } from "lucide-react"

const CATEGORY_META: Record<string, { color: string; description: string; emoji: string }> = {
  tech:       { color: "#F7931A", description: "Engineering, dev, and infrastructure discussions", emoji: "⚡" },
  design:     { color: "#FFD600", description: "UI/UX, product design, and creative conversations", emoji: "🎨" },
  finance:    { color: "#EA580C", description: "Fintech, DeFi, crypto, and investment talks", emoji: "📊" },
  marketing:  { color: "#F7931A", description: "Growth, content, brand, and go-to-market strategies", emoji: "📣" },
  data:       { color: "#FFD600", description: "Data science, analytics, and machine learning", emoji: "🔢" },
  startup:    { color: "#EA580C", description: "Founders, investors, and startup ecosystem news", emoji: "🚀" },
  general:    { color: "#94A3B8", description: "Open discussions, networking, and introductions", emoji: "💬" },
  career:     { color: "#F7931A", description: "Job search tips, interview prep, and career advice", emoji: "🎯" },
}

export default async function CommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: channels } = await supabase
    .from("community_channels")
    .select("*, channel_members(user_id)")
    .order("name")

  const { data: memberships } = await supabase
    .from("channel_members")
    .select("channel_id")
    .eq("user_id", user.id)

  const joinedIds = new Set(memberships?.map(m => m.channel_id) || [])

  const totalMembers = (channels || []).reduce((sum, ch) => sum + (ch.channel_members?.length || 0), 0)
  const joinedCount = joinedIds.size

  // Sort channels: largest member count first within each category
  const byCategory = (channels || []).reduce((acc: Record<string, any[]>, ch) => {
    const cat = ch.category || "general"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(ch)
    return acc
  }, {})

  // Sort each category's channels by member count desc
  for (const cat of Object.keys(byCategory)) {
    byCategory[cat].sort((a, b) => (b.channel_members?.length || 0) - (a.channel_members?.length || 0))
  }

  // Find the most popular channel
  const allSorted = (channels || []).slice().sort((a, b) => (b.channel_members?.length || 0) - (a.channel_members?.length || 0))
  const topChannel = allSorted[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-white">Community</h1>
          <p className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8] mt-0.5">
            {channels?.length || 0} channels · {totalMembers} members
          </p>
        </div>
        <div className="flex items-center gap-2">
          {joinedCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F7931A]/10 border border-[#F7931A]/25">
              <CheckCircle className="h-3.5 w-3.5 text-[#F7931A]" />
              <span className="font-data text-[10px] tracking-wider uppercase text-[#F7931A]">
                {joinedCount} joined
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats bar */}
      {(channels?.length || 0) > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Channels", value: channels?.length || 0, icon: Hash, color: "#F7931A" },
            { label: "Members", value: totalMembers, icon: Users, color: "#FFD600" },
            { label: "Joined", value: joinedCount, icon: CheckCircle, color: "#22c55e" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl bg-[#0F1115] border border-white/8 p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                <Icon className="h-3.5 w-3.5" style={{ color }} />
              </div>
              <div>
                <p className="font-heading font-bold text-lg leading-none" style={{ color }}>{value}</p>
                <p className="font-data text-[9px] tracking-wider uppercase text-[#94A3B8] mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Most active channel highlight */}
      {topChannel && (topChannel.channel_members?.length || 0) > 1 && (
        <Link href={`/community/${topChannel.id}`}>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-[#F7931A]/10 to-transparent border border-[#F7931A]/25 hover:border-[#F7931A]/40 transition-all duration-300 cursor-pointer">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-[#F7931A]" />
              <span className="font-data text-[10px] tracking-widest uppercase text-[#F7931A]">Most Active</span>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Hash className="h-4 w-4 text-white shrink-0" />
              <p className="font-heading font-semibold text-white truncate">#{topChannel.name}</p>
            </div>
            <div className="flex items-center gap-1 font-data text-[10px] text-[#94A3B8] shrink-0">
              <Users className="h-3 w-3" />{topChannel.channel_members?.length || 0} members
            </div>
          </div>
        </Link>
      )}

      {/* Channel categories */}
      {Object.entries(byCategory).map(([category, chans]) => {
        const meta = CATEGORY_META[category] || { color: "#F7931A", description: "", emoji: "💬" }
        const accent = meta.color
        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-base">{meta.emoji}</span>
              <div className="flex-1">
                <h2 className="font-heading font-semibold text-sm capitalize" style={{ color: accent }}>
                  {category}
                </h2>
                {meta.description && (
                  <p className="font-body text-xs text-[#94A3B8]">{meta.description}</p>
                )}
              </div>
              <span className="font-data text-[10px] text-[#94A3B8]">{chans.length} channel{chans.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {chans.map((channel) => {
                const memberCount = channel.channel_members?.length || 0
                const isJoined = joinedIds.has(channel.id)
                const isPopular = memberCount >= 5

                return (
                  <Link key={channel.id} href={`/community/${channel.id}`}>
                    <div className="flex items-start gap-3 p-5 rounded-2xl bg-[#0F1115] border border-white/8 hover:border-[#F7931A]/30 hover:shadow-[0_0_20px_-8px_rgba(247,147,26,0.2)] transition-all duration-300 h-full cursor-pointer relative overflow-hidden">
                      {/* Accent glow */}
                      {isJoined && (
                        <div className="absolute top-0 right-0 w-1 h-full opacity-60" style={{ background: accent }} />
                      )}

                      <div
                        className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
                      >
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
                          {isPopular && !isJoined && (
                            <span className="font-data text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e]">
                              Popular
                            </span>
                          )}
                        </div>

                        {channel.description && (
                          <p className="font-body text-xs text-[#94A3B8] mt-1 line-clamp-2">{channel.description}</p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 font-data text-[10px] text-[#94A3B8]">
                            <Users className="h-3 w-3" />{memberCount} member{memberCount !== 1 ? "s" : ""}
                          </div>
                          {!isJoined && (
                            <span className="font-data text-[9px] tracking-wider uppercase text-[#F7931A]">
                              Join →
                            </span>
                          )}
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

      {/* Empty state */}
      {!channels?.length && (
        <div className="text-center py-32 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#F7931A]/15 border border-[#F7931A]/30 flex items-center justify-center mx-auto">
            <MessageCircle className="h-8 w-8 text-[#F7931A]" />
          </div>
          <div>
            <p className="font-heading font-semibold text-white mb-1">No channels yet</p>
            <p className="font-body text-sm text-[#94A3B8] max-w-xs mx-auto">
              Community channels haven&apos;t been set up yet. Ask an admin to create some channels to get started.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
