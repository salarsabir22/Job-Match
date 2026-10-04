import { Modal, Pressable, StyleSheet, Text, View } from "react-native"
import { PrimaryButton, GhostButton } from "@/components/ui"
import { colors } from "@/lib/theme"

export function MatchSheet({
  open,
  name,
  onChat,
  onDismiss,
}: {
  open: boolean
  name: string
  onChat?: () => void
  onDismiss: () => void
}) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <Text style={styles.kicker}>Match</Text>
          <Text style={styles.title}>You’re connected</Text>
          <Text style={styles.body}>You can now message {name} about this role.</Text>
          {onChat ? <PrimaryButton label="Open chat" onPress={onChat} /> : null}
          <GhostButton label="Keep going" onPress={onDismiss} />
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 24 },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 22,
    gap: 10,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: colors.faint,
  },
  title: { fontSize: 24, fontWeight: "700", letterSpacing: -0.6, color: colors.ink },
  body: { fontSize: 15, lineHeight: 22, color: colors.muted, marginBottom: 6 },
})
