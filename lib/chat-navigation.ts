import type { SupabaseClient } from "@supabase/supabase-js"

/** `/chat/[conversationId]` — resolves match_id → conversation id when needed. */
export async function resolveChatPath(
  supabase: SupabaseClient,
  opts: { conversationId?: string | null; matchId?: string | null }
): Promise<string | null> {
  if (opts.conversationId) return `/chat/${opts.conversationId}`
  if (opts.matchId) {
    const { data } = await supabase.from("conversations").select("id").eq("match_id", opts.matchId).maybeSingle()
    if (data?.id) return `/chat/${data.id}`
  }
  return null
}
