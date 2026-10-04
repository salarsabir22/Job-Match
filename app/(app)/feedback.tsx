import { useState } from "react"
import { ScrollView, StyleSheet, Text } from "react-native"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { ErrorText, Field, PrimaryButton } from "@/components/ui"
import { colors } from "@/lib/theme"

export default function FeedbackScreen() {
  const { session, profile } = useSession()
  const [liked, setLiked] = useState("")
  const [disliked, setDisliked] = useState("")
  const [improve, setImprove] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!liked.trim() && !disliked.trim() && !improve.trim()) {
      setError("Add at least one comment.")
      return
    }
    setSending(true)
    setError(null)
    const { error: saveError } = await supabase.from("product_feedback").insert({
      user_id: session!.user.id,
      role: profile?.role ?? null,
      liked: liked.trim() || null,
      disliked: disliked.trim() || null,
      improve: improve.trim() || null,
    })
    setSending(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    setLiked("")
    setDisliked("")
    setImprove("")
    setDone(true)
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Field
        label="What you like"
        value={liked}
        onChangeText={setLiked}
        multiline
        autoCapitalize="sentences"
        style={{ minHeight: 88, textAlignVertical: "top", paddingTop: 12 }}
      />
      <Field
        label="What isn’t working"
        value={disliked}
        onChangeText={setDisliked}
        multiline
        autoCapitalize="sentences"
        style={{ minHeight: 88, textAlignVertical: "top", paddingTop: 12 }}
      />
      <Field
        label="What to add next"
        value={improve}
        onChangeText={setImprove}
        multiline
        autoCapitalize="sentences"
        style={{ minHeight: 88, textAlignVertical: "top", paddingTop: 12 }}
      />
      <ErrorText message={error} />
      {done ? <Text style={styles.done}>Sent. Thanks — send another anytime.</Text> : null}
      <PrimaryButton label={done ? "Send another" : "Send feedback"} loading={sending} onPress={() => void submit()} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  wrap: { padding: 20, gap: 14, paddingBottom: 40 },
  done: { fontSize: 14, color: colors.navy, fontWeight: "600" },
})
