import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStreamServerClient, isStreamConfigured } from "@/lib/stream/server"

type Body = {
  conversationId?: string
  memberIds?: string[]
  name?: string
}

export async function POST(request: Request) {
  if (!isStreamConfigured()) {
    return NextResponse.json(
      { error: "Stream chat is not configured on the server." },
      { status: 503 }
    )
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const conversationId = body.conversationId?.trim()
  const memberIds = Array.from(new Set(body.memberIds?.filter(Boolean) ?? []))
  const name = body.name?.trim()

  if (!conversationId || memberIds.length < 2) {
    return NextResponse.json(
      { error: "conversationId and at least 2 memberIds are required." },
      { status: 400 }
    )
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!memberIds.includes(user.id)) {
      return NextResponse.json({ error: "Current user must be a channel member." }, { status: 403 })
    }

    const stream = getStreamServerClient()
    const { data: memberProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", memberIds)

    if (memberProfiles?.length) {
      await stream.upsertUsers(
        memberProfiles.map((p) => ({
          id: p.id,
          name: p.full_name || p.id,
          image: p.avatar_url || undefined,
        }))
      )
    }

    const channelId = `conversation-${conversationId}`
    const channel = stream.channel("messaging", channelId, {
      members: memberIds,
      name: name || undefined,
      created_by_id: user.id,
    })

    try {
      await channel.create()
    } catch {
      // already exists
    }

    const state = await channel.query()
    const existingMemberIds = Object.keys(state.members ?? {})
    const missingMembers = memberIds.filter((id) => !existingMemberIds.includes(id))
    if (missingMembers.length > 0) {
      await channel.addMembers(missingMembers)
    }

    // Backfill old Supabase message history only when the Stream channel is empty.
    if ((state.messages?.length ?? 0) === 0) {
      const { data: legacyMessages } = await supabase
        .from("messages")
        .select("sender_id, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      for (const msg of legacyMessages ?? []) {
        const senderId = (msg as { sender_id?: string }).sender_id
        const text = (msg as { content?: string }).content
        if (!senderId || !text) continue

        await channel.sendMessage(
          {
            text,
            // Mark this content as migrated legacy text.
            migrated_from_supabase: true,
          },
          senderId
        )
      }
    }

    return NextResponse.json({ ok: true, channelId })
  } catch (error) {
    console.error("[api/stream/channel]", error)
    return NextResponse.json({ error: "Failed to ensure chat channel." }, { status: 500 })
  }
}
