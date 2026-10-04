export const FEED_REACTIONS = [
  { id: "like", label: "Like", emoji: "👍" },
  { id: "celebrate", label: "Celebrate", emoji: "👏" },
  { id: "support", label: "Support", emoji: "💪" },
  { id: "love", label: "Love", emoji: "❤️" },
  { id: "insightful", label: "Insightful", emoji: "💡" },
  { id: "funny", label: "Funny", emoji: "😂" },
] as const

export type FeedReactionId = (typeof FEED_REACTIONS)[number]["id"]

export function isFeedReaction(value: string | null | undefined): value is FeedReactionId {
  return FEED_REACTIONS.some((item) => item.id === value)
}

export function reactionSummary(likes: { user_id?: string; reaction?: string | null }[] | null | undefined) {
  const counts = new Map<FeedReactionId, number>()
  for (const row of likes || []) {
    const id = isFeedReaction(row.reaction) ? row.reaction : "like"
    counts.set(id, (counts.get(id) || 0) + 1)
  }
  const chips = FEED_REACTIONS.filter((item) => counts.get(item.id)).map((item) => ({
    ...item,
    count: counts.get(item.id) || 0,
  }))
  const total = [...counts.values()].reduce((sum, n) => sum + n, 0)
  return { chips, total }
}
