import { useState } from "react"
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native"
import { Link } from "expo-router"
import { supabase } from "@/lib/supabase"
import { resetRedirect } from "@/lib/auth-route"
import { ErrorText, Field, PrimaryButton } from "@/components/ui"
import { colors } from "@/lib/theme"

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    setError(null)
    if (!email.trim()) {
      setError("Enter your email.")
      return
    }
    setLoading(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${resetRedirect}?type=recovery`,
    })
    setLoading(false)
    if (resetError) {
      setError(resetError.message)
      return
    }
    setSent(true)
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.ink }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.wrap}>
        <Text style={styles.wordmark}>swypejobs.</Text>
        <Text style={styles.title}>{sent ? "Check your inbox" : "Reset password"}</Text>
        <Text style={styles.lede}>
          {sent
            ? `We sent a reset link to ${email}. Open it, then sign in with the new password.`
            : "We’ll email a reset link. Open it on this phone to set a new password."}
        </Text>
        {!sent ? (
          <View style={{ gap: 14, marginTop: 28 }}>
            <Field tone="dark" label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <ErrorText message={error} />
            <PrimaryButton label="Send link" loading={loading} onPress={() => void send()} />
          </View>
        ) : null}
        <Link href="/login" asChild>
          <Pressable style={{ marginTop: 24 }}>
            <Text style={styles.link}>Back to sign in</Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  wordmark: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 18,
    fontWeight: "600",
    textTransform: "lowercase",
  },
  title: {
    marginTop: 28,
    color: colors.white,
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -1,
  },
  lede: {
    marginTop: 10,
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    lineHeight: 22,
  },
  link: { color: "rgba(255,255,255,0.55)", fontSize: 14, fontWeight: "500" },
})
