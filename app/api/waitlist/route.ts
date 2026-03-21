import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  const v = raw.trim().toLowerCase()
  if (!v) return null
  if (!v.includes("@") || !v.includes(".")) return null
  return v
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const email = normalizeEmail(
    typeof body === "object" && body !== null && "email" in body
      ? (body as { email: unknown }).email
      : null
  )

  if (!email) {
    return NextResponse.json(
      { error: "Email is required and must look valid." },
      { status: 400 }
    )
  }

  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from("waitlist_emails")
      .upsert({ email }, { onConflict: "email" })

    if (error) {
      console.error("[api/waitlist] upsert error:", error)
      return NextResponse.json({ error: "Failed to join waitlist." }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[api/waitlist]", e)
    const message = e instanceof Error ? e.message : "Server error."
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json(
        { error: "Waitlist is not configured (missing server key)." },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: "Failed to join waitlist." }, { status: 500 })
  }
}
