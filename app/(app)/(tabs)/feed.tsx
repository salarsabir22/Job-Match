import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { one } from "@/lib/one"
import { getBlockedPeerIds } from "@/lib/blocks"
import { FEED_REACTIONS, reactionSummary, type FeedReactionId } from "@/lib/reactions"
import { extFromType, pickImage, pickVideo, uploadUri } from "@/lib/upload"
import { CardBox, Chip, EmptyState, GhostButton, PageHeader, PrimaryButton, Screen } from "@/components/ui"
import { ReportBlock } from "@/components/ReportBlock"
import { MediaPlayer } from "@/components/MediaPlayer"
import { colors } from "@/lib/theme"

type Like = { user_id: string; reaction?: string | null }
type Post = {
  id: string
  body: string | null
  image_url?: string | null
  media_type?: string | null
  created_at: string
  author_id: string
  shared_post_id?: string | null
  profiles?: { full_name?: string | null; role?: string | null } | { full_name?: string | null; role?: string | null }[] | null
  feed_post_likes?: Like[] | null
  feed_post_comments?: { id: string; body: string; author_id: string }[] | null
  shared?:
    | { id: string; body?: string | null; image_url?: string | null; media_type?: string | null }
    | { id: string; body?: string | null; image_url?: string | null; media_type?: string | null }[]
    | null
}

export default function FeedScreen() {
  const { session, profile } = useSession()
  const userId = session!.user.id
  const [posts, setPosts] = useState<Post[]>([])
  const [blocked, setBlocked] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [media, setMedia] = useState<{ uri: string; contentType: string } | null>(null)
  const [posting, setPosting] = useState(false)
  const [commentFor, setCommentFor] = useState<string | null>(null)
  const [comment, setComment] = useState("")
  const [filter, setFilter] = useState<"all" | "student" | "recruiter">("all")
  const [editId, setEditId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState("")
  const [editComment, setEditComment] = useState<{ postId: string; id: string; body: string } | null>(null)

  const load = useCallback(async () => {
    const [blockedIds, postsRes] = await Promise.all([
      getBlockedPeerIds(supabase, userId),
      supabase
        .from("feed_posts")
        .select(
          "id, body, image_url, media_type, created_at, author_id, shared_post_id, profiles!feed_posts_author_id_fkey(full_name, role), feed_post_likes(user_id, reaction), feed_post_comments(id, body, author_id), shared:feed_posts!shared_post_id(id, body, image_url, media_type)"
        )
        .order("created_at", { ascending: false })
        .limit(40),
    ])
    setBlocked(blockedIds)
    if (postsRes.error) {
      const fallback = await supabase
        .from("feed_posts")
        .select(
          "id, body, created_at, author_id, shared_post_id, profiles!feed_posts_author_id_fkey(full_name, role), feed_post_likes(user_id), feed_post_comments(id, body, author_id)"
        )
        .order("created_at", { ascending: false })
        .limit(40)
      if (fallback.error) {
        setError(fallback.error.message)
        setPosts([])
      } else {
        setError(null)
        setPosts((fallback.data ?? []) as Post[])
      }
    } else {
      setError(null)
      setPosts((postsRes.data ?? []) as Post[])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void load()
    const channel = supabase
      .channel("mobile-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "feed_posts" }, () => {
        void load()
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [load])

  const publish = async () => {
    const body = draft.trim()
    if ((!body && !media) || posting) return
    setPosting(true)
    let imageUrl: string | null = null
    if (media) {
      try {
        const ext = extFromType(media.contentType, "jpg")
        imageUrl = await uploadUri({
          bucket: "feed-media",
          path: `${userId}/${Date.now()}.${ext}`,
          uri: media.uri,
          contentType: media.contentType,
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn’t upload photo")
        setPosting(false)
        return
      }
    }
    const payload: Record<string, unknown> = { author_id: userId, body: body || null }
    if (imageUrl) {
      payload.image_url = imageUrl
      payload.media_type = media?.contentType.startsWith("video/") ? "video" : "image"
    }
    let { error: saveError } = await supabase.from("feed_posts").insert(payload)
    if (saveError && payload.media_type) {
      delete payload.media_type
      saveError = (await supabase.from("feed_posts").insert(payload)).error
    }
    setPosting(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    setDraft("")
    setMedia(null)
    await load()
  }

  const react = async (post: Post, reaction: FeedReactionId) => {
    const mine = (post.feed_post_likes || []).find((l) => l.user_id === userId)
    if (mine) {
      await supabase.from("feed_post_likes").delete().eq("post_id", post.id).eq("user_id", userId)
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, feed_post_likes: (p.feed_post_likes || []).filter((l) => l.user_id !== userId) } : p
        )
      )
      if (mine.reaction === reaction) return
    }
    const insert = await supabase.from("feed_post_likes").insert({ post_id: post.id, user_id: userId, reaction })
    if (insert.error) {
      await supabase.from("feed_post_likes").insert({ post_id: post.id, user_id: userId })
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, feed_post_likes: [...(p.feed_post_likes || []).filter((l) => l.user_id !== userId), { user_id: userId, reaction }] }
          : p
      )
    )
  }

  const sendComment = async (postId: string) => {
    const body = comment.trim()
    if (!body) return
    const { data, error: saveError } = await supabase
      .from("feed_post_comments")
      .insert({ post_id: postId, author_id: userId, body })
      .select("id, body, author_id")
      .single()
    if (saveError || !data) {
      setError(saveError?.message || "Couldn’t comment")
      return
    }
    setComment("")
    setCommentFor(null)
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, feed_post_comments: [...(p.feed_post_comments || []), data] } : p))
    )
  }

  const removeComment = async (postId: string, commentId: string) => {
    await supabase.from("feed_post_comments").delete().eq("id", commentId).eq("author_id", userId)
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, feed_post_comments: (p.feed_post_comments || []).filter((c) => c.id !== commentId) }
          : p
      )
    )
  }

  const repost = async (post: Post) => {
    const originalId = post.shared_post_id || post.id
    const { error: saveError } = await supabase.from("feed_posts").insert({
      author_id: userId,
      body: null,
      shared_post_id: originalId,
    })
    if (saveError) {
      setError(saveError.message)
      return
    }
    await load()
  }

  const saveEdit = async () => {
    if (!editId) return
    const body = editBody.trim()
    await supabase.from("feed_posts").update({ body, updated_at: new Date().toISOString() }).eq("id", editId).eq("author_id", userId)
    setPosts((prev) => prev.map((p) => (p.id === editId ? { ...p, body } : p)))
    setEditId(null)
  }

  const deletePost = async (postId: string) => {
    await supabase.from("feed_posts").delete().eq("id", postId).eq("author_id", userId)
    setPosts((prev) => prev.filter((p) => p.id !== postId && p.shared_post_id !== postId))
  }

  const saveCommentEdit = async () => {
    if (!editComment) return
    const body = editComment.body.trim()
    if (!body) return
    await supabase.from("feed_post_comments").update({ body }).eq("id", editComment.id).eq("author_id", userId)
    setPosts((prev) =>
      prev.map((p) =>
        p.id === editComment.postId
          ? {
              ...p,
              feed_post_comments: (p.feed_post_comments || []).map((c) => (c.id === editComment.id ? { ...c, body } : c)),
            }
          : p
      )
    )
    setEditComment(null)
  }

  const visible = posts.filter((p) => {
    if (blocked.has(p.author_id)) return false
    if (filter !== "all" && one(p.profiles)?.role !== filter) return false
    return true
  })

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <PageHeader kicker="Feed" title="Campus posts" />
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={profile?.role === "recruiter" ? "Share a hiring note" : "Share an update"}
            placeholderTextColor="rgba(0,0,0,0.32)"
            style={styles.input}
            multiline
          />
          {media ? <Text style={styles.meta}>{media.contentType.startsWith("video/") ? "Video attached" : "Photo attached"}</Text> : null}
          <View style={styles.row}>
            <GhostButton
              label="Photo"
              onPress={() => {
                void (async () => {
                  try {
                    const picked = await pickImage()
                    if (picked) setMedia({ uri: picked.uri, contentType: picked.contentType })
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Couldn’t pick photo")
                  }
                })()
              }}
            />
            <GhostButton
              label="Video"
              onPress={() => {
                void (async () => {
                  try {
                    const picked = await pickVideo()
                    if (picked) setMedia({ uri: picked.uri, contentType: picked.contentType })
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Couldn’t pick video")
                  }
                })()
              }}
            />
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Post" loading={posting} onPress={() => void publish()} />
            </View>
          </View>
          <View style={styles.filterRow}>
            <Chip label="All" selected={filter === "all"} onPress={() => setFilter("all")} />
            <Chip label="Students" selected={filter === "student"} onPress={() => setFilter("student")} />
            <Chip label="Recruiters" selected={filter === "recruiter"} onPress={() => setFilter("recruiter")} />
          </View>
        </View>
        {loading ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: 32 }} />
        ) : (
          <FlatList
            data={visible}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 32, gap: 10 }}
            refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} />}
            ListEmptyComponent={
              <EmptyState title={error ? "Couldn’t load feed" : "Quiet for now"} body={error ?? "Be the first post."} />
            }
            renderItem={({ item }) => {
              const author = one(item.profiles)
              const summary = reactionSummary(item.feed_post_likes)
              const original = item.shared_post_id ? one(item.shared) : null
              const shareCount = posts.filter((row) => row.shared_post_id === item.id).length
              return (
                <CardBox>
                  <Text style={styles.author}>
                    {author?.full_name || "Member"}
                    {author?.role ? ` · ${author.role}` : ""}
                    {item.shared_post_id ? " · repost" : ""}
                  </Text>
                  {item.body && editId !== item.id ? <Text style={styles.body}>{item.body}</Text> : null}
                  {editId === item.id ? (
                    <View style={{ marginTop: 8, gap: 8 }}>
                      <TextInput value={editBody} onChangeText={setEditBody} style={styles.input} multiline />
                      <PrimaryButton label="Save" onPress={() => void saveEdit()} />
                    </View>
                  ) : null}
                  {item.shared_post_id ? (
                    <View style={styles.repost}>
                      <Text style={styles.meta}>Original</Text>
                      {original?.body ? <Text style={styles.body}>{original.body}</Text> : null}
                      {original?.media_type === "video" && original?.image_url ? (
                        <MediaPlayer uri={original.image_url} height={160} />
                      ) : original?.image_url ? (
                        <Image source={{ uri: original.image_url }} style={styles.photo} />
                      ) : null}
                    </View>
                  ) : item.media_type === "video" && item.image_url ? (
                    <View style={{ marginTop: 10 }}>
                      <MediaPlayer uri={item.image_url} height={180} />
                    </View>
                  ) : item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.photo} />
                  ) : null}
                  <View style={styles.filterRow}>
                    {FEED_REACTIONS.map((r) => (
                      <Chip
                        key={r.id}
                        label={`${r.emoji}${summary.chips.find((c) => c.id === r.id)?.count ? ` ${summary.chips.find((c) => c.id === r.id)?.count}` : ""}`}
                        selected={(item.feed_post_likes || []).some((l) => l.user_id === userId && (l.reaction || "like") === r.id)}
                        onPress={() => void react(item, r.id)}
                      />
                    ))}
                  </View>
                  <View style={styles.row}>
                    <GhostButton
                      label={`Comment ${item.feed_post_comments?.length || 0}`}
                      onPress={() => setCommentFor(commentFor === item.id ? null : item.id)}
                    />
                    <GhostButton label={shareCount ? `Repost ${shareCount}` : "Repost"} onPress={() => void repost(item)} />
                    <GhostButton
                      label="Share"
                      onPress={() => void Share.share({ message: item.body || original?.body || "JobMatch post" })}
                    />
                  </View>
                  {item.author_id === userId ? (
                    <View style={styles.row}>
                      <GhostButton
                        label="Edit"
                        onPress={() => {
                          setEditId(item.id)
                          setEditBody(item.body || "")
                        }}
                      />
                      <GhostButton label="Delete" onPress={() => void deletePost(item.id)} />
                    </View>
                  ) : null}
                  {(item.feed_post_comments || []).slice(-3).map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => {
                        if (c.author_id === userId) setEditComment({ postId: item.id, id: c.id, body: c.body })
                      }}
                      onLongPress={() => {
                        if (c.author_id === userId) void removeComment(item.id, c.id)
                      }}
                    >
                      <Text style={styles.comment}>
                        {c.body}
                        {c.author_id === userId ? "  · tap to edit · hold to delete" : ""}
                      </Text>
                    </Pressable>
                  ))}
                  {editComment?.postId === item.id ? (
                    <View style={{ marginTop: 10, gap: 8 }}>
                      <TextInput
                        value={editComment.body}
                        onChangeText={(body) => setEditComment({ ...editComment, body })}
                        style={styles.input}
                      />
                      <PrimaryButton label="Save comment" onPress={() => void saveCommentEdit()} />
                    </View>
                  ) : null}
                  {commentFor === item.id ? (
                    <View style={{ marginTop: 10, gap: 8 }}>
                      <TextInput
                        value={comment}
                        onChangeText={setComment}
                        placeholder="Write a comment"
                        placeholderTextColor="rgba(0,0,0,0.32)"
                        style={styles.input}
                      />
                      <PrimaryButton label="Send" onPress={() => void sendComment(item.id)} />
                    </View>
                  ) : null}
                  {item.author_id !== userId ? (
                    <View style={{ marginTop: 10 }}>
                      <ReportBlock currentUserId={userId} peerId={item.author_id} peerName={author?.full_name} onBlocked={() => void load()} />
                    </View>
                  ) : null}
                </CardBox>
              )
            }}
          />
        )}
      </SafeAreaView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  composer: { paddingHorizontal: 22, paddingBottom: 12, gap: 8 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
  },
  author: { fontSize: 12, fontWeight: "600", color: colors.navy, textTransform: "capitalize" },
  body: { marginTop: 8, fontSize: 15, lineHeight: 22, color: colors.ink },
  photo: { marginTop: 10, width: "100%", height: 180, borderRadius: 12, backgroundColor: colors.line },
  row: { flexDirection: "row", gap: 8, marginTop: 12 },
  comment: { marginTop: 8, fontSize: 13, lineHeight: 18, color: colors.muted },
  meta: { fontSize: 12, color: colors.navy },
  repost: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    padding: 12,
  },
})
