import { useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { JOB_CATEGORIES } from "@/lib/completeness"
import { JOB_TYPES } from "@/lib/format"
import { notifyNewJobsInCategory } from "@/lib/engagement"
import { ErrorText, Field, PrimaryButton } from "@/components/ui"
import { colors } from "@/lib/theme"

export default function NewJobScreen() {
  const router = useRouter()
  const { session } = useSession()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [jobType, setJobType] = useState("internship")
  const [location, setLocation] = useState("")
  const [remote, setRemote] = useState(true)
  const [skills, setSkills] = useState("")
  const [nice, setNice] = useState("")
  const [category, setCategory] = useState("")
  const [min, setMin] = useState("")
  const [max, setMax] = useState("")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    if (!title.trim() || !jobType) {
      setError("Title and type are required.")
      return
    }
    setLoading(true)
    setError(null)
    const payload: Record<string, unknown> = {
      recruiter_id: session!.user.id,
      title: title.trim(),
      description: description.trim() || null,
      job_type: jobType,
      location: location.trim() || null,
      is_remote: remote,
      required_skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      nice_to_have_skills: nice.split(",").map((s) => s.trim()).filter(Boolean),
      is_active: true,
    }
    if (category) payload.category = category
    if (min) payload.salary_min = Number(min)
    if (max) payload.salary_max = Number(max)
    if (note.trim()) payload.compensation_note = note.trim()
    payload.salary_currency = "PKR"
    let { error: saveError } = await supabase.from("jobs").insert(payload)
    if (saveError && (category || min || max || note.trim())) {
      delete payload.category
      delete payload.salary_min
      delete payload.salary_max
      delete payload.compensation_note
      delete payload.salary_currency
      const retry = await supabase.from("jobs").insert(payload)
      saveError = retry.error
    }
    setLoading(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    if (category) void notifyNewJobsInCategory(supabase, { category })
    router.replace("/jobs")
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Field label="Title" value={title} onChangeText={setTitle} autoCapitalize="sentences" />
      <Text style={styles.label}>Type</Text>
      <View style={styles.chips}>
        {JOB_TYPES.map((t) => (
          <Pressable key={t.value} onPress={() => setJobType(t.value)} style={[styles.chip, jobType === t.value && styles.chipOn]}>
            <Text style={[styles.chipText, jobType === t.value && { color: colors.white }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      <Field
        label="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        autoCapitalize="sentences"
        style={{ minHeight: 100, textAlignVertical: "top", paddingTop: 12 }}
      />
      <Pressable onPress={() => setRemote((v) => !v)} style={styles.toggle}>
        <Text style={styles.toggleText}>{remote ? "Remote" : "On-site / hybrid"}</Text>
      </Pressable>
      {!remote ? <Field label="Location" value={location} onChangeText={setLocation} autoCapitalize="words" /> : null}
      <Field label="Required skills (comma separated)" value={skills} onChangeText={setSkills} autoCapitalize="words" />
      <Field label="Nice-to-have skills" value={nice} onChangeText={setNice} autoCapitalize="words" />
      <Text style={styles.label}>Category</Text>
      <View style={styles.chips}>
        {JOB_CATEGORIES.map((c) => (
          <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipOn]}>
            <Text style={[styles.chipText, category === c && { color: colors.white }]}>{c}</Text>
          </Pressable>
        ))}
      </View>
      <Field label="Pay min (PKR)" value={min} onChangeText={setMin} keyboardType="number-pad" />
      <Field label="Pay max (PKR)" value={max} onChangeText={setMax} keyboardType="number-pad" />
      <Field label="Pay note" value={note} onChangeText={setNote} autoCapitalize="sentences" />
      <ErrorText message={error} />
      <PrimaryButton label="Post listing" loading={loading} onPress={() => void save()} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  wrap: { padding: 20, gap: 14, paddingBottom: 40 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.faint,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.ink },
  toggle: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  toggleText: { fontSize: 16, fontWeight: "600", color: colors.ink },
})
