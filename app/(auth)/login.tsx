import { useState } from "react"
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { Redirect, Link, useRouter } from "expo-router"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { signInWithGoogle } from "@/lib/oauth"
import { routeAfterLogin } from "@/lib/auth-route"
import { ErrorText, Field, GhostButton, PrimaryButton } from "@/components/ui"
import { colors } from "@/lib/theme"

export default function LoginScreen() {
  const router = useRouter()
  const { ready, session, refresh } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (ready && session) return <Redirect href="/" />

  const submit = async () => {
    setError(null)
    if (!email.trim() || !password) {
      setError("Email and password are required.")
      return
    }
    setLoading(true)
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (authError) {
      setLoading(false)
      if (authError.message.includes("Invalid login")) setError("Incorrect email or password.")
      else if (authError.message.includes("Email not confirmed")) setError("Confirm your email, then sign in.")
      else setError(authError.message)
      return
    }
    await refresh()
    const next = await routeAfterLogin(data.user.id)
    setLoading(false)
    router.replace(next)
  }

  const google = async () => {
    setError(null)
    setLoading(true)
    try {
      const session = await signInWithGoogle()
      if (!session) {
        setLoading(false)
        return
      }
      await refresh()
      const next = await routeAfterLogin(session.user.id)
      router.replace(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed.")
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.ink }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Text style={styles.wordmark}>
          swypejobs<Text style={{ opacity: 0.45 }}>.</Text>
        </Text>
        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.lede}>Same account as the website. Swipe, match, chat.</Text>
        <View style={{ gap: 14, marginTop: 28 }}>
          <Field tone="dark" label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
          <Field tone="dark" label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
          <ErrorText message={error} />
          <PrimaryButton label="Continue" onPress={() => void submit()} loading={loading} />
          <GhostButton label="Continue with Google" onPress={() => void google()} disabled={loading} />
        </View>
        <Link href="/forgot-password" asChild>
          <Pressable style={{ marginTop: 18 }}>
            <Text style={styles.link}>Forgot password?</Text>
          </Pressable>
        </Link>
        <Link href="/signup" asChild>
          <Pressable style={{ marginTop: 14 }}>
            <Text style={styles.link}>New here? Create an account</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  wordmark: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.4,
    textTransform: "lowercase",
  },
  title: {
    marginTop: 28,
    color: colors.white,
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -1.2,
  },
  lede: {
    marginTop: 10,
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    lineHeight: 22,
    maxWidth: 320,
  },
  link: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    fontWeight: "500",
  },
})
