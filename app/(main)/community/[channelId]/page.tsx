import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Users, Hash } from "lucide-react"
import { ChannelChat } from "@/components/community/ChannelChat"
import { JoinChannelButton } from "./JoinChannelButton"

export default async function ChannelPage({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: channel } = await supabase.from("community_channels").select("*").eq("id", channelId).single()
  if (!channel) notFound()

  const { data: membership } = await supabase.from("channel_members").select("user_id").eq("channel_id", channelId).eq("user_id", user.id).single()
  const { count: memberCount } = await supabase.from("channel_members").select("*", { count: "exact", head: true }).eq("channel_id", channelId)
  const isMember = !!membership

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-black/10 bg-white" style={{ height: "calc(100dvh - 10rem)" }}>
      {/* Channel header */}
      <div className="flex items-center gap-3 p-4 border-b border-black/10 z-10 shrink-0">
        <Link href="/community"
          className="w-9 h-9 rounded-full bg-white/5 border border-black/10 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0">
          <ArrowLeft className="h-4 w-4 text-black" />
        </Link>
        <div className="w-9 h-9 rounded-xl bg-[#FAFAFA]/15 border border-[#FAFAFA]/30 flex items-center justify-center shrink-0">
          <Hash className="h-4 w-4 text-[#FAFAFA]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-sm text-black">#{channel.name}</p>
          <p className="font-data text-[10px] text-neutral-700 flex items-center gap-1">
            <Users className="h-3 w-3" />{memberCount} members
          </p>
        </div>
        <JoinChannelButton channelId={channelId} isMember={isMember} userId={user.id} />
      </div>

      {isMember ? (
        <ChannelChat channelId={channelId} currentUserId={user.id} />
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 gap-5 p-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#FAFAFA]/15 border border-[#FAFAFA]/30 flex items-center justify-center">
            <Users className="h-8 w-8 text-[#FAFAFA]" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-lg text-black">Join #{channel.name}</h3>
            <p className="font-body text-sm text-neutral-700 mt-1 max-w-[240px]">
              {channel.description || "Join this channel to start chatting."}
            </p>
          </div>
          <JoinChannelButton channelId={channelId} isMember={false} userId={user.id} showLabel />
        </div>
      )}
    </div>
  )
}
