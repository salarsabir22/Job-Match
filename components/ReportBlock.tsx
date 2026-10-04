import { useEffect, useState } from "react"
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { supabase } from "@/lib/supabase"
import { isBlockedWith, REPORT_REASONS } from "@/lib/blocks"
import { Chip, GhostButton, PrimaryButton } from "@/components/ui"
import { colors } from "@/lib/theme"

export function ReportBlock({
  currentUserId,
  peerId,
  peerName,
  onBlocked,
}: {
  currentUserId: string
  peerId: string
  peerName?: string | null
  onBlocked?: () => void
}) {
  const [blocked, setBlocked] = useState(false)
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number]["value"]>("spam")
  const [details, setDetails] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void (async () => {
      const state = await isBlockedWith(supabase, currentUserId, peerId)
      setBlocked(state.blockedByMe)
    })()
  }, [currentUserId, peerId])

  const toggleBlock = async () => {
    setBusy(true)
    if (blocked) {
      await supabase.from("blocks").delete().eq("blocker_id", currentUserId).eq("blocked_id", peerId)
      setBlocked(false)
    } else {
      await supabase.from("blocks").insert({ blocker_id: currentUserId, blocked_id: peerId })
      setBlocked(true)
      onBlocked?.()
    }
    setBusy(false)
  }

  const submit = async () => {
    setBusy(true)
    const { error } = await supabase.from("reports").insert({
      reporter_id: currentUserId,
      reported_id: peerId,
      reason,
      details: details.trim() || null,
    })
    setBusy(false)
    if (error) {
      Alert.alert("Couldn’t send report", error.message)
      return
    }
    setOpen(false)
    setDetails("")
    Alert.alert("Report sent", "Thanks — we’ll review it.")
  }

  if (currentUserId === peerId) return null

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <GhostButton label="Report" onPress={() => setOpen(true)} disabled={busy} />
        <GhostButton label={blocked ? "Unblock" : "Block"} onPress={() => void toggleBlock()} disabled={busy} />
      </View>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.title}>Report {peerName || "this profile"}</Text>
            <Text style={styles.body}>Reports go to swypejobs admins. Blocking is separate.</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {REPORT_REASONS.map((item) => (
                <Chip
                  key={item.value}
                  label={item.label}
                  selected={reason === item.value}
                  onPress={() => setReason(item.value)}
                />
              ))}
            </View>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="What happened? (optional)"
              placeholderTextColor="rgba(0,0,0,0.32)"
              style={styles.input}
              multiline
            />
            <PrimaryButton label="Send report" loading={busy} onPress={() => void submit()} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 10,
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.ink },
  body: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  input: {
    minHeight: 88,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    padding: 12,
    textAlignVertical: "top",
    color: colors.ink,
  },
})
