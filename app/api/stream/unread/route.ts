import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStreamServerClient, isStreamConfigured } from "@/lib/stream/server"

export async function GET() {
  if (!isStreamConfigured()) {
    return NextResponse.json({ totalUnreadCount: 0, unreadChannels: 0 })
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stream = getStreamServerClient()
    const { users } = await stream.queryUsers(
      { id: { $eq: user.id } },
      {},
      { limit: 1, presence: false }
    )

    const streamUser = users[0]
    const totalUnreadCount = Number((streamUser as any)?.total_unread_count ?? 0)
    const unreadChannels = Number((streamUser as any)?.unread_channels ?? 0)

    return NextResponse.json({ totalUnreadCount, unreadChannels })
  } catch (error) {
    console.error("[api/stream/unread]", error)
    return NextResponse.json({ totalUnreadCount: 0, unreadChannels: 0 })
  }
}
