import { useState } from "react"
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { Link, Redirect, useRouter } from "expo-router"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { signInWithGoogle } from "@/lib/oauth"
import { ErrorText, Field, GhostButton, PrimaryButton } from "@/components/ui"
import { colors } from "@/lib/theme"

type Role = "student" | "recruiter"

export default function SignupScreen() {
  const router = useRouter()
  const { ready, session, refresh } = useSession()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<Role>("student")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verify, setVerify] = useState(false)

  if (ready && session) return <Redirect href="/" />

  const submit = async () => {
    setError(null)
    if (fullName.trim().length < 2) {
      setError("Enter your full name.")
      return
    }
    if (!email.trim() || password.length < 6) {
      setError("Use a valid email and a password of at least 6 characters.")
      return
    }
    setLoading(true)
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), role } },
    })
    if (authError) {
      setLoading(false)
      if (authError.message.includes("already")) setError("That email is already registered. Sign in instead.")
      else setError(authError.message)
      return
    }
    if (data.session && data.user) {
      await supabase.from("profiles").update({ role }).eq("id", data.user.id)
      await refresh()
      setLoading(false)
      router.replace("/onboarding")
      return
    }
    setVerify(true)
    setLoading(false)
  }

  if (verify) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.wordmark}>jobmatch.</Text>
        <Text style={styles.title}>Check your inbox</Text>
        <Text style={styles.lede}>
          We sent a confirmation link to {email}. Open it, then come back and sign in.
        </Text>
        <Link href="/login" asChild>
          <Pressable style={{ marginTop: 24 }}>
            <Text style={styles.link}>Back to sign in</Text>
          </Pressable>
        </Link>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.ink }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Text style={styles.wordmark}>jobmatch.</Text>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.lede}>Same backend as the site. Pick the role you’ll use.</Text>
        <View style={styles.roles}>
          {(["student", "recruiter"] as const).map((item) => (
            <Pressable
              key={item}
              onPress={() => setRole(item)}
              style={[styles.role, role === item && styles.roleOn]}
            >
              <Text style={[styles.roleLabel, role === item && { color: colors.white }]}>
                {item === "student" ? "Student" : "Recruiter"}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={{ gap: 14, marginTop: 22 }}>
          <Field tone="dark" label="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" autoComplete="name" />
          <Field tone="dark" label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
          <Field tone="dark" label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password-new" />
          <ErrorText message={error} />
          <PrimaryButton label="Create account" onPress={() => void submit()} loading={loading} />
          <GhostButton
            label="Continue with Google"
            disabled={loading}
            onPress={() => {
              void (async () => {
                setError(null)
                setLoading(true)
                try {
                  const session = await signInWithGoogle()
                  if (!session) {
                    setLoading(false)
                    return
                  }
                  await supabase.from("profiles").update({ role }).eq("id", session.user.id)
                  await refresh()
                  router.replace("/onboarding")
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Google sign-in failed.")
                  setLoading(false)
                }
              })()
            }}
          />
        </View>
        <Link href="/login" asChild>
          <Pressable style={{ marginTop: 22 }}>
            <Text style={styles.link}>Already have an account? Sign in</Text>
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
    backgroundColor: colors.ink,
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
  },
  roles: {
    flexDirection: "row",
    gap: 8,
    marginTop: 24,
  },
  role: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    paddingVertical: 10,
    alignItems: "center",
  },
  roleOn: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  roleLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "600",
  },
  link: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    fontWeight: "500",
  },
})
