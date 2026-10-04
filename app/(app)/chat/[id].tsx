import { useEffect, useRef, useState } from "react"
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { one } from "@/lib/one"
import { extFromType, pickAnyFile, pickAudioFile, pickCamera, pickImage, pickVideo, uploadUri } from "@/lib/upload"
import { classifyByMime, sanitizeChatFileName } from "@/lib/chat-media"
import { setActiveConversation } from "@/lib/push"
import { formatVoiceClock, MAX_VOICE_SECONDS } from "@/lib/voice"
import { Field, GhostButton, PrimaryButton } from "@/components/ui"
import { ReportBlock } from "@/components/ReportBlock"
import { ChatMedia, Caption } from "@/components/ChatMedia"
import { colors } from "@/lib/theme"

type MatchJoin = {
  id?: string
  student_id?: string
  recruiter_id?: string
  jobs?: { title?: string | null } | { title?: string | null }[] | null
}

type Message = {
  id: string
  sender_id: string
  content: string
  created_at: string
  is_read?: boolean | null
  media_url?: string | null
  message_type?: string | null
  duration_seconds?: number | null
  file_name?: string | null
  mime_type?: string | null
}

type Proposal = {
  id: string
  proposed_by: string
  proposed_at: string
  location_or_link: string | null
  note: string | null
  status: string
}

export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { session } = useSession()
  const userId = session!.user.id
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [peer, setPeer] = useState<{ id: string; name: string; job: string } | null>(null)
  const [matchId, setMatchId] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)
  const [peerTyping, setPeerTyping] = useState(false)
  const [interviewOpen, setInterviewOpen] = useState(false)
  const [when, setWhen] = useState("")
  const [link, setLink] = useState("")
  const [note, setNote] = useState("")
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const liveChannel = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const finishingVoice = useRef(false)
  const holdingVoice = useRef(false)
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const recState = useAudioRecorderState(recorder, 200)
  const [attachOpen, setAttachOpen] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    setActiveConversation(id)
    let cancelled = false
    const load = async () => {
      const { data: convo } = await supabase
        .from("conversations")
        .select("id, match_id, matches(id, student_id, recruiter_id, jobs(title))")
        .eq("id", id)
        .maybeSingle()
      const match = one(convo?.matches as MatchJoin | MatchJoin[] | null)
      const resolvedMatchId = (convo?.match_id as string | undefined) || match?.id || null
      if (!cancelled) setMatchId(resolvedMatchId)
      if (match?.student_id && match.recruiter_id) {
        const peerId = match.student_id === userId ? match.recruiter_id : match.student_id
        const { data: person } = await supabase.from("profiles").select("full_name").eq("id", peerId).maybeSingle()
        if (!cancelled) {
          setPeer({
            id: peerId,
            name: (person?.full_name as string) || "Match",
            job: one(match.jobs)?.title || "Role",
          })
        }
      }
      const muteRes = await supabase
        .from("conversation_mutes")
        .select("conversation_id")
        .eq("user_id", userId)
        .eq("conversation_id", id)
        .maybeSingle()
      if (!cancelled && !muteRes.error) setMuted(Boolean(muteRes.data))

      const proposalRes = await supabase
        .from("interview_proposals")
        .select("id, proposed_by, proposed_at, location_or_link, note, status")
        .eq("conversation_id", id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!cancelled && !proposalRes.error) setProposal((proposalRes.data as Proposal | null) ?? null)

      const withMedia = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at, is_read, media_url, message_type, duration_seconds, file_name, mime_type")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true })
        .limit(200)
      const rows = withMedia.error
        ? await supabase
            .from("messages")
            .select("id, sender_id, content, created_at, is_read, media_url, message_type")
            .eq("conversation_id", id)
            .order("created_at", { ascending: true })
            .limit(200)
        : withMedia
      if (!cancelled) setMessages((rows.data ?? []) as Message[])
      await supabase.from("messages").update({ is_read: true }).eq("conversation_id", id).neq("sender_id", userId)
    }
    void load()

    const channel = supabase
      .channel(`mobile-messages:${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          const row = payload.new as Message
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]))
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          const row = payload.new as Message
          setMessages((prev) => prev.map((m) => (m.id === row.id ? { ...m, ...row } : m)))
        }
      )
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.userId === userId) return
        setPeerTyping(true)
        if (typingTimer.current) clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => setPeerTyping(false), 1600)
      })
      .subscribe()

    liveChannel.current = channel

    return () => {
      cancelled = true
      setActiveConversation(null)
      liveChannel.current = null
      if (typingTimer.current) clearTimeout(typingTimer.current)
      void supabase.removeChannel(channel)
    }
  }, [id, userId])

  const sendTyping = () => {
    void liveChannel.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { userId },
    })
  }

  const send = async (extra?: {
    content?: string
    mediaUrl?: string
    type?: string
    duration?: number
    fileName?: string
    mimeType?: string
  }) => {
    const content = extra?.content ?? draft.trim()
    if ((!content && !extra?.mediaUrl) || !id || sending) return
    setSending(true)
    if (!extra) setDraft("")
    const payload: Record<string, unknown> = {
      conversation_id: id,
      sender_id: userId,
      content: content || extra?.fileName || "File",
      message_type: extra?.type || "text",
    }
    if (extra?.mediaUrl) payload.media_url = extra.mediaUrl
    if (extra?.duration) payload.duration_seconds = extra.duration
    if (extra?.fileName) payload.file_name = extra.fileName
    if (extra?.mimeType) payload.mime_type = extra.mimeType
    const { data, error } = await supabase
      .from("messages")
      .insert(payload)
      .select("id, sender_id, content, created_at, is_read, media_url, message_type, duration_seconds, file_name, mime_type")
      .single()
    if (error && (extra?.duration || extra?.fileName)) {
      delete payload.duration_seconds
      delete payload.file_name
      delete payload.mime_type
      const retry = await supabase
        .from("messages")
        .insert(payload)
        .select("id, sender_id, content, created_at, is_read, media_url, message_type")
        .single()
      if (retry.data) setMessages((prev) => (prev.some((m) => m.id === retry.data.id) ? prev : [...prev, retry.data as Message]))
    } else if (error && !extra) setDraft(content)
    else if (data) setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data as Message]))
    setSending(false)
  }

  const attachPicked = async (picked: { uri: string; contentType: string; name: string } | null) => {
    if (!picked || !id) return
    const kind = classifyByMime(picked.contentType, picked.name)
    const ext = extFromType(picked.contentType, kind === "video" ? "mp4" : kind === "audio" ? "m4a" : kind === "image" ? "jpg" : "bin")
    const name = sanitizeChatFileName(picked.name)
    const path = `${userId}/${id}/${Date.now()}-${name || ext}`
    const urlPath = await uploadUri({
      bucket: "chat-media",
      path,
      uri: picked.uri,
      contentType: picked.contentType,
    })
    const label = kind === "image" ? "Photo" : kind === "video" ? "Video" : kind === "audio" ? "Audio" : name
    await send({
      content: label,
      mediaUrl: path,
      type: kind,
      fileName: name,
      mimeType: picked.contentType,
    })
    void urlPath
  }

  const attach = async () => {
    try {
      await attachPicked(await pickImage())
    } catch {
      // ignore picker cancel / upload miss
    }
  }

  const startVoice = async () => {
    if (sending || recState.isRecording) return
    const perm = await AudioModule.requestRecordingPermissionsAsync()
    if (!perm.granted) return
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })
    await recorder.prepareToRecordAsync()
    recorder.record()
  }

  const cancelVoice = async () => {
    holdingVoice.current = false
    finishingVoice.current = true
    try {
      if (recState.isRecording) await recorder.stop()
    } finally {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true })
      finishingVoice.current = false
    }
  }

  const sendVoice = async () => {
    if (finishingVoice.current || sending) return
    finishingVoice.current = true
    const duration = Math.max(1, Math.min(MAX_VOICE_SECONDS, Math.round((recState.durationMillis || 0) / 1000)))
    try {
      if (recState.isRecording) await recorder.stop()
      const uri = recorder.uri
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true })
      if (!uri || !id) return
      const path = `${userId}/${id}/${Date.now()}.m4a`
      await uploadUri({
        bucket: "chat-media",
        path,
        uri,
        contentType: "audio/mp4",
      })
      await send({ content: "Voice message", mediaUrl: path, type: "voice", duration })
    } finally {
      finishingVoice.current = false
    }
  }

  useEffect(() => {
    if (recState.isRecording && recState.durationMillis >= MAX_VOICE_SECONDS * 1000) {
      void sendVoice()
    }
  }, [recState.isRecording, recState.durationMillis])

  const toggleMute = async () => {
    if (!id) return
    if (muted) {
      await supabase.from("conversation_mutes").delete().eq("user_id", userId).eq("conversation_id", id)
      setMuted(false)
      return
    }
    await supabase.from("conversation_mutes").insert({ user_id: userId, conversation_id: id })
    setMuted(true)
  }

  const proposeInterview = async () => {
    if (!id || !matchId || !peer) return
    const proposedAt = new Date(when.replace(" ", "T")).toISOString()
    if (Number.isNaN(Date.parse(proposedAt))) return
    setSending(true)
    const { error } = await supabase.from("interview_proposals").insert({
      match_id: matchId,
      conversation_id: id,
      proposed_by: userId,
      proposed_at: proposedAt,
      location_or_link: link.trim() || null,
      note: note.trim() || null,
    })
    if (error) {
      setSending(false)
      return
    }
    const whenLabel = new Date(proposedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    const text = `Interview proposed for ${whenLabel}${link.trim() ? ` · ${link.trim()}` : ""}`
    await supabase.from("messages").insert({
      conversation_id: id,
      sender_id: userId,
      content: text,
      message_type: "text",
    })
    await supabase.from("notifications").insert({
      user_id: peer.id,
      type: "interview_request",
      title: "Interview proposed",
      body: text,
      data: { conversation_id: id, match_id: matchId },
    })
    await supabase.from("matches").update({ pipeline_status: "interview" }).eq("id", matchId)
    setProposal({
      id: "local",
      proposed_by: userId,
      proposed_at: proposedAt,
      location_or_link: link.trim() || null,
      note: note.trim() || null,
      status: "pending",
    })
    setInterviewOpen(false)
    setWhen("")
    setLink("")
    setNote("")
    setSending(false)
  }

  const setProposalStatus = async (status: "accepted" | "declined" | "cancelled") => {
    if (!proposal) return
    if (proposal.id !== "local") {
      await supabase.from("interview_proposals").update({ status }).eq("id", proposal.id)
    }
    if (matchId && status === "declined") {
      await supabase.from("matches").update({ pipeline_status: "chatting" }).eq("id", matchId)
    }
    if (matchId && status === "accepted") {
      await supabase.from("matches").update({ pipeline_status: "interview" }).eq("id", matchId)
    }
    setProposal(null)
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {peer ? (
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.peer}>{peer.name}</Text>
            <Text style={styles.job}>{peerTyping ? "typing…" : peer.job}</Text>
          </View>
          <GhostButton
            label="Profile"
            onPress={() => router.push(peer.id === userId ? "/profile" : `/candidate/${peer.id}`)}
          />
        </View>
      ) : null}
      {peer ? (
        <View style={styles.toolbar}>
          <GhostButton label={muted ? "Unmute" : "Mute"} onPress={() => void toggleMute()} />
          {matchId ? <GhostButton label="Interview" onPress={() => setInterviewOpen(true)} /> : null}
        </View>
      ) : null}
      {proposal ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            {proposal.proposed_by === userId ? "Interview proposed" : "Interview request"} ·{" "}
            {new Date(proposal.proposed_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
            {proposal.location_or_link ? ` · ${proposal.location_or_link}` : ""}
          </Text>
          {proposal.proposed_by === userId ? (
            <GhostButton label="Cancel" onPress={() => void setProposalStatus("cancelled")} />
          ) : (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <GhostButton label="Decline" onPress={() => void setProposalStatus("declined")} />
              <GhostButton label="Accept" onPress={() => void setProposalStatus("accepted")} />
            </View>
          )}
        </View>
      ) : null}
      {peer && peer.id !== userId ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <ReportBlock currentUserId={userId} peerId={peer.id} peerName={peer.name} />
        </View>
      ) : null}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 12 }}
        renderItem={({ item }) => {
          const mine = item.sender_id === userId
          const hasMedia = Boolean(item.media_url)
          return (
            <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              {hasMedia ? (
                <ChatMedia
                  messageType={item.message_type}
                  src={item.media_url!}
                  content={item.content}
                  fileName={item.file_name}
                  mimeType={item.mime_type}
                  durationSeconds={item.duration_seconds}
                  own={mine}
                />
              ) : null}
              {hasMedia ? (
                <Caption content={item.content} own={mine} />
              ) : item.content ? (
                <Text style={[styles.body, mine && { color: colors.white }]}>{item.content}</Text>
              ) : null}
              {mine ? <Text style={styles.tick}>{item.is_read ? "Read" : "Sent"}</Text> : null}
            </View>
          )
        }}
      />
      {recState.isRecording ? (
        <View style={styles.composer}>
          <GhostButton label="Cancel" onPress={() => void cancelVoice()} disabled={sending} />
          <Text style={styles.recTime}>{formatVoiceClock(recState.durationMillis / 1000)}</Text>
          <PrimaryButton label="Send" loading={sending} onPress={() => void sendVoice()} />
        </View>
      ) : (
        <View>
          {attachOpen ? (
            <View style={styles.attachRow}>
              <GhostButton
                label="Camera"
                onPress={() => {
                  void (async () => {
                    try {
                      await attachPicked(await pickCamera())
                    } catch {
                      /* ignore */
                    }
                  })()
                }}
              />
              <GhostButton
                label="Video"
                onPress={() => {
                  void (async () => {
                    try {
                      await attachPicked(await pickVideo())
                    } catch {
                      /* ignore */
                    }
                  })()
                }}
              />
              <GhostButton
                label="File"
                onPress={() => {
                  void (async () => {
                    try {
                      await attachPicked(await pickAnyFile())
                    } catch {
                      /* ignore */
                    }
                  })()
                }}
              />
              <GhostButton
                label="Audio"
                onPress={() => {
                  void (async () => {
                    try {
                      await attachPicked(await pickAudioFile())
                    } catch {
                      /* ignore */
                    }
                  })()
                }}
              />
            </View>
          ) : null}
          {emojiOpen ? (
            <View style={styles.attachRow}>
              {["👍", "😂", "❤️", "🎉", "🔥", "👀", "✅", "🙏"].map((emoji) => (
                <Pressable key={emoji} onPress={() => setDraft((d) => d + emoji)}>
                  <Text style={{ fontSize: 22 }}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <View style={styles.composer}>
            <GhostButton label="+" onPress={() => setAttachOpen((v) => !v)} disabled={sending} />
            <GhostButton label="Photo" onPress={() => void attach()} disabled={sending} />
            <Pressable
              delayLongPress={180}
              onLongPress={() => {
                holdingVoice.current = true
                void startVoice()
              }}
              onPress={() => void startVoice()}
              onPressOut={() => {
                if (holdingVoice.current && recState.isRecording) {
                  holdingVoice.current = false
                  void sendVoice()
                }
              }}
              style={styles.voiceHit}
            >
              <Text style={styles.voiceLabel}>Voice</Text>
            </Pressable>
            <GhostButton label="☺" onPress={() => setEmojiOpen((v) => !v)} disabled={sending} />
            <TextInput
              value={draft}
              onChangeText={(value) => {
                setDraft(value)
                sendTyping()
              }}
              placeholder="Message"
              placeholderTextColor="rgba(0,0,0,0.32)"
              style={styles.input}
              multiline
            />
            <PrimaryButton label="Send" loading={sending} onPress={() => void send()} />
          </View>
        </View>
      )}
      <Modal visible={interviewOpen} transparent animationType="fade" onRequestClose={() => setInterviewOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setInterviewOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>Propose an interview</Text>
            <Text style={styles.sheetBody}>Sends a chat message and moves this match to Interview.</Text>
            <Field
              label="When (YYYY-MM-DD HH:MM)"
              value={when}
              onChangeText={setWhen}
              placeholder="2026-09-22 14:00"
            />
            <Field label="Link or location" value={link} onChangeText={setLink} placeholder="Meet / Zoom / office" />
            <Field
              label="Note"
              value={note}
              onChangeText={setNote}
              multiline
              style={{ minHeight: 72, textAlignVertical: "top", paddingTop: 12 }}
            />
            <PrimaryButton label="Send" loading={sending} onPress={() => void proposeInterview()} />
            <GhostButton label="Cancel" onPress={() => setInterviewOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toolbar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.white,
    gap: 8,
  },
  bannerText: { fontSize: 13, color: colors.ink, lineHeight: 18 },
  peer: { fontSize: 16, fontWeight: "700", color: colors.ink },
  job: { marginTop: 2, fontSize: 13, color: colors.muted },
  bubble: {
    maxWidth: "82%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  mine: { alignSelf: "flex-end", backgroundColor: colors.navy },
  theirs: {
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  body: { fontSize: 15, lineHeight: 20, color: colors.ink },
  tick: { marginTop: 4, fontSize: 10, color: "rgba(255,255,255,0.7)", textAlign: "right" },
  photo: { width: 180, height: 140, borderRadius: 10, marginBottom: 6, backgroundColor: colors.line },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
  },
  recTime: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.danger,
    paddingVertical: 10,
    fontVariant: ["tabular-nums"],
  },
  attachRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: colors.white,
  },
  voiceHit: {
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: "center",
  },
  voiceLabel: { fontSize: 13, fontWeight: "600", color: colors.ink },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 12,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: colors.ink },
  sheetBody: { fontSize: 13, color: colors.muted, lineHeight: 18 },
})
