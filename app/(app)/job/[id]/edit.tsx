import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { supabase } from "@/lib/supabase"
import { JOB_CATEGORIES } from "@/lib/completeness"
import { JOB_TYPES } from "@/lib/format"
import { ErrorText, Field, PrimaryButton } from "@/components/ui"
import { colors } from "@/lib/theme"

export default function EditJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [jobType, setJobType] = useState("internship")
  const [location, setLocation] = useState("")
  const [remote, setRemote] = useState(false)
  const [skills, setSkills] = useState("")
  const [nice, setNice] = useState("")
  const [category, setCategory] = useState("")
  const [min, setMin] = useState("")
  const [max, setMax] = useState("")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from("jobs")
      .select("title, description, job_type, location, is_remote, required_skills, nice_to_have_skills, category, salary_min, salary_max, compensation_note")
      .eq("id", id)
      .maybeSingle()
    if (loadError || !data) {
      setError(loadError?.message || "Couldn’t load job")
      setLoading(false)
      return
    }
    setTitle(data.title || "")
    setDescription(data.description || "")
    setJobType(data.job_type || "internship")
    setLocation(data.location || "")
    setRemote(Boolean(data.is_remote))
    setSkills((data.required_skills || []).join(", "))
    setNice((data.nice_to_have_skills || []).join(", "))
    setCategory(data.category || "")
    setMin(data.salary_min ? String(data.salary_min) : "")
    setMax(data.salary_max ? String(data.salary_max) : "")
    setNote(data.compensation_note || "")
    setLoading(false)
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    setSaving(true)
    setError(null)
    const payload: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim() || null,
      job_type: jobType,
      location: location.trim() || null,
      is_remote: remote,
      required_skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      nice_to_have_skills: nice.split(",").map((s) => s.trim()).filter(Boolean),
      category: category || null,
      salary_min: min ? Number(min) : null,
      salary_max: max ? Number(max) : null,
      compensation_note: note.trim() || null,
      salary_currency: "PKR",
    }
    let { error: saveError } = await supabase.from("jobs").update(payload).eq("id", id)
    if (saveError) {
      delete payload.salary_min
      delete payload.salary_max
      delete payload.compensation_note
      delete payload.salary_currency
      const retry = await supabase.from("jobs").update(payload).eq("id", id)
      saveError = retry.error
    }
    setSaving(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    router.back()
  }

  if (loading) return <ActivityIndicator color={colors.navy} style={{ marginTop: 40 }} />

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
      <Field label="Location" value={location} onChangeText={setLocation} autoCapitalize="words" />
      <Field label="Required skills" value={skills} onChangeText={setSkills} autoCapitalize="words" />
      <Field label="Nice-to-have skills" value={nice} onChangeText={setNice} autoCapitalize="words" />
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
      <PrimaryButton label="Save" loading={saving} onPress={() => void save()} />
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
