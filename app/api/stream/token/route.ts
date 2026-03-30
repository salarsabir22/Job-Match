import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStreamServerClient, isStreamConfigured } from "@/lib/stream/server"

export async function POST() {
  if (!isStreamConfigured()) {
    return NextResponse.json(
      { error: "Stream chat is not configured on the server." },
      { status: 503 }
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()

    const stream = getStreamServerClient()
    const streamUser = {
      id: user.id,
      name: profile?.full_name || user.email || "User",
      image: profile?.avatar_url || undefined,
    }

    await stream.upsertUser(streamUser)
    const token = stream.createToken(user.id)

    return NextResponse.json({
      token,
      user: streamUser,
      apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY,
    })
  } catch (error) {
    console.error("[api/stream/token]", error)
    return NextResponse.json({ error: "Failed to create chat token." }, { status: 500 })
  }
}
