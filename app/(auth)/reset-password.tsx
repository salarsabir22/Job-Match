import { useState } from "react"
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native"
import { Link, useRouter } from "expo-router"
import { supabase } from "@/lib/supabase"
import { ErrorText, Field, PrimaryButton } from "@/components/ui"
import { colors } from "@/lib/theme"

export default function ResetPasswordScreen() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    if (password.length < 6) {
      setError("Use at least 6 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords don’t match.")
      return
    }
    setLoading(true)
    const { error: saveError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    router.replace("/discover")
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.ink }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.wrap}>
        <Text style={styles.wordmark}>jobmatch.</Text>
        <Text style={styles.title}>New password</Text>
        <Text style={styles.lede}>Choose a password for the same account you use on the website.</Text>
        <View style={{ gap: 14, marginTop: 28 }}>
          <Field tone="dark" label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <Field tone="dark" label="Confirm" value={confirm} onChangeText={setConfirm} secureTextEntry />
          <ErrorText message={error} />
          <PrimaryButton label="Save password" loading={loading} onPress={() => void save()} />
        </View>
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
  wordmark: { color: "rgba(255,255,255,0.9)", fontSize: 18, fontWeight: "600" },
  title: { marginTop: 28, color: colors.white, fontSize: 32, fontWeight: "700", letterSpacing: -1 },
  lede: { marginTop: 10, color: "rgba(255,255,255,0.5)", fontSize: 16, lineHeight: 22 },
  link: { color: "rgba(255,255,255,0.55)", fontSize: 14, fontWeight: "500" },
})
