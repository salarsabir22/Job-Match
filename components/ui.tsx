import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewProps,
} from "react-native"
import type { ReactNode } from "react"
import { colors } from "@/lib/theme"

export function Screen({ children, style, ...rest }: ViewProps) {
  return (
    <View style={[styles.screen, style]} {...rest}>
      {children}
    </View>
  )
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  light,
}: {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  light?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        light ? styles.btnLight : styles.btnNavy,
        (disabled || loading) && { opacity: 0.55 },
        pressed && { opacity: 0.88 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={light ? colors.ink : colors.white} />
      ) : (
        <Text style={[styles.btnLabel, light && { color: colors.ink }]}>{label}</Text>
      )}
    </Pressable>
  )
}

export function Field({
  label,
  tone = "light",
  ...rest
}: TextInputProps & { label: string; tone?: "light" | "dark" }) {
  const dark = tone === "dark"
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.fieldLabel, dark && { color: "rgba(255,255,255,0.45)" }]}>{label}</Text>
      <TextInput
        placeholderTextColor={dark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.32)"}
        style={[
          styles.input,
          dark && {
            backgroundColor: "rgba(255,255,255,0.08)",
            borderColor: "rgba(255,255,255,0.14)",
            color: colors.white,
          },
        ]}
        autoCapitalize="none"
        {...rest}
      />
    </View>
  )
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null
  return <Text style={styles.error}>{message}</Text>
}

export function GhostButton({
  label,
  onPress,
  disabled,
}: {
  label: string
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.ghost,
        disabled && { opacity: 0.5 },
        pressed && { opacity: 0.88 },
      ]}
    >
      <Text style={styles.ghostLabel}>{label}</Text>
    </Pressable>
  )
}

export function PageHeader({ kicker, title, right }: { kicker: string; title: string; right?: ReactNode }) {
  return (
    <View style={styles.head}>
      <View style={{ flex: 1 }}>
        <Text style={styles.kicker}>{kicker}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      {right}
    </View>
  )
}

export function CardBox({ children, onPress }: { children: ReactNode; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}>
        {children}
      </Pressable>
    )
  }
  return <View style={styles.card}>{children}</View>
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  )
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string
  selected?: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipOn]}>
      <Text style={[styles.chipText, selected && { color: colors.white }]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  btn: {
    minHeight: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  btnNavy: {
    backgroundColor: colors.navy,
  },
  btnLight: {
    backgroundColor: colors.white,
  },
  btnLabel: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.faint,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.ink,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  empty: {
    padding: 28,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.4,
    color: colors.ink,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  ghost: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  ghostLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 12,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: colors.faint,
  },
  title: {
    marginTop: 8,
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.7,
    color: colors.ink,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.ink,
  },
})
