import type { SupabaseClient } from "@supabase/supabase-js"
import { one } from "@/lib/one"

export async function loadUnreadCounts(supabase: SupabaseClient, userId: string) {
  const pingRes = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)

  const { data: convos } = await supabase
    .from("conversations")
    .select("id, matches(student_id, recruiter_id)")
  const mine = (convos ?? []).flatMap((row) => {
    const match = one(row.matches as { student_id?: string; recruiter_id?: string } | { student_id?: string; recruiter_id?: string }[] | null)
    if (!match?.student_id || !match.recruiter_id) return []
    if (match.student_id !== userId && match.recruiter_id !== userId) return []
    return [row.id as string]
  })
  let chat = 0
  if (mine.length) {
    const [{ data: mutes }, unreadRes] = await Promise.all([
      supabase.from("conversation_mutes").select("conversation_id").eq("user_id", userId),
      supabase
        .from("messages")
        .select("id, conversation_id")
        .in("conversation_id", mine)
        .eq("is_read", false)
        .neq("sender_id", userId),
    ])
    const muted = new Set((mutes ?? []).map((m) => m.conversation_id as string))
    chat = (unreadRes.data ?? []).filter((m) => !muted.has(m.conversation_id as string)).length
  }

  return { chat, pings: pingRes.count ?? 0 }
}
