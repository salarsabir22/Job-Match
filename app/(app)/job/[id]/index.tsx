import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { one } from "@/lib/one"
import { jobTypeLabel, salaryLine } from "@/lib/format"
import { recordJobView } from "@/lib/engagement"
import { CardBox, EmptyState, GhostButton, PrimaryButton } from "@/components/ui"
import { colors } from "@/lib/theme"

type Job = {
  id: string
  title: string
  description: string | null
  job_type: string
  location: string | null
  is_remote: boolean
  is_active: boolean
  recruiter_id: string
  required_skills: string[] | null
  nice_to_have_skills: string[] | null
  category: string | null
  salary_min?: number | null
  salary_max?: number | null
  salary_currency?: string | null
  compensation_note?: string | null
  recruiter_profiles?: { company_name?: string | null; is_approved?: boolean | null } | { company_name?: string | null; is_approved?: boolean | null }[] | null
}

type Applicant = {
  id: string
  name: string
  school: string
  decision: "right" | "left" | null
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { session, profile } = useSession()
  const [job, setJob] = useState<Job | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const mine = profile?.role === "recruiter" && job?.recruiter_id === session?.user.id

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from("jobs")
      .select(
        "id, title, description, job_type, location, is_remote, is_active, recruiter_id, required_skills, nice_to_have_skills, category, salary_min, salary_max, salary_currency, compensation_note, recruiter_profiles(company_name, is_approved)"
      )
      .eq("id", id)
      .maybeSingle()
    if (loadError || !data) {
      setError(loadError?.message || "Role not found")
      return
    }
    setJob(data as Job)
    if (session?.user.id && profile?.role === "student") {
      await recordJobView(supabase, {
        studentId: session.user.id,
        jobId: (data as Job).id,
        recruiterId: (data as Job).recruiter_id,
        jobTitle: (data as Job).title,
      })
    }
  }, [id, profile?.role, session?.user.id])

  const loadApplicants = useCallback(async () => {
    if (!id || !session) return
    const { data: apps } = await supabase
      .from("job_swipes")
      .select("student_id, created_at")
      .eq("job_id", id)
      .eq("direction", "right")
      .order("created_at", { ascending: false })
    const ids = [...new Set((apps ?? []).map((a) => a.student_id as string))]
    if (!ids.length) {
      setApplicants([])
      return
    }
    const [{ data: people }, { data: students }, { data: decisions }] = await Promise.all([
      supabase.from("profiles").select("id, full_name").in("id", ids),
      supabase.from("student_profiles").select("id, university, degree, graduation_year").in("id", ids),
      supabase
        .from("candidate_swipes")
        .select("student_id, direction")
        .eq("recruiter_id", session.user.id)
        .eq("job_id", id)
        .in("student_id", ids),
    ])
    const names = new Map((people ?? []).map((p) => [p.id as string, (p.full_name as string) || "Student"]))
    const school = new Map(
      (students ?? []).map((s) => [
        s.id as string,
        [s.degree, s.university, s.graduation_year].filter(Boolean).join(" · "),
      ])
    )
    const decided = new Map((decisions ?? []).map((d) => [d.student_id as string, d.direction as "right" | "left"]))
    setApplicants(
      ids.map((sid) => ({
        id: sid,
        name: names.get(sid) || "Student",
        school: school.get(sid) || "",
        decision: decided.get(sid) ?? null,
      }))
    )
  }, [id, session])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (mine) void loadApplicants()
  }, [mine, loadApplicants])

  const swipe = async (direction: "right" | "left" | "saved") => {
    if (!job || !session) return
    setBusy(true)
    const { error: swipeError } = await supabase.from("job_swipes").insert({
      student_id: session.user.id,
      job_id: job.id,
      direction,
    })
    setBusy(false)
    if (swipeError && !swipeError.message.toLowerCase().includes("duplicate")) {
      setError(swipeError.message)
      return
    }
    router.back()
  }

  const toggleActive = async () => {
    if (!job) return
    setBusy(true)
    await supabase.from("jobs").update({ is_active: !job.is_active }).eq("id", job.id)
    setBusy(false)
    await load()
  }

  const decide = async (studentId: string, direction: "right" | "left") => {
    if (!job || !session) return
    await supabase.from("candidate_swipes").insert({
      recruiter_id: session.user.id,
      student_id: studentId,
      job_id: job.id,
      direction,
    })
    setApplicants((prev) => prev.map((a) => (a.id === studentId ? { ...a, decision: direction } : a)))
  }

  if (!job && !error) return <ActivityIndicator color={colors.navy} style={{ marginTop: 40 }} />
  if (!job) return <EmptyState title="Missing role" body={error || ""} />

  const company = one(job.recruiter_profiles)
  const pay = salaryLine({
    min: job.salary_min,
    max: job.salary_max,
    currency: job.salary_currency,
    note: job.compensation_note,
  })

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.meta}>
        {jobTypeLabel(job.job_type)}
        {job.is_remote ? " · Remote" : job.location ? ` · ${job.location}` : ""}
        {job.is_active ? "" : " · Paused"}
      </Text>
      <Text style={styles.title}>{job.title}</Text>
      {company?.company_name ? (
        <Pressable onPress={() => router.push(`/company/${job.recruiter_id}`)}>
          <Text style={styles.company}>{company.company_name}</Text>
        </Pressable>
      ) : null}
      {pay ? <Text style={styles.pay}>{pay}</Text> : null}
      {job.category ? <Text style={styles.cat}>{job.category}</Text> : null}
      {job.description ? <Text style={styles.body}>{job.description}</Text> : null}
      {job.required_skills?.length ? <Text style={styles.skills}>Need: {job.required_skills.join(" · ")}</Text> : null}
      {job.nice_to_have_skills?.length ? (
        <Text style={styles.skills}>Nice: {job.nice_to_have_skills.join(" · ")}</Text>
      ) : null}

      {mine ? (
        <View style={{ gap: 10, marginTop: 8 }}>
          <PrimaryButton label="Edit listing" onPress={() => router.push(`/job/${job.id}/edit`)} />
          <GhostButton label={job.is_active ? "Pause listing" : "Reactivate"} onPress={() => void toggleActive()} disabled={busy} />
          <Text style={styles.section}>Applicants</Text>
          {applicants.length === 0 ? (
            <Text style={styles.cat}>No applications yet.</Text>
          ) : (
            applicants.map((a) => (
              <CardBox key={a.id} onPress={() => router.push(`/candidate/${a.id}`)}>
                <Text style={styles.applicantName}>{a.name}</Text>
                {a.school ? <Text style={styles.cat}>{a.school}</Text> : null}
                {a.decision ? (
                  <Text style={styles.meta}>{a.decision === "right" ? "Shortlisted" : "Passed"}</Text>
                ) : (
                  <View style={styles.applicantActions}>
                    <GhostButton label="Pass" onPress={() => void decide(a.id, "left")} />
                    <GhostButton label="Shortlist" onPress={() => void decide(a.id, "right")} />
                  </View>
                )}
              </CardBox>
            ))
          )}
        </View>
      ) : profile?.role === "student" ? (
        <View style={{ gap: 10, marginTop: 8 }}>
          <PrimaryButton label="I’m interested" loading={busy} onPress={() => void swipe("right")} />
          <GhostButton label="Save" onPress={() => void swipe("saved")} disabled={busy} />
          <GhostButton label="Pass" onPress={() => void swipe("left")} disabled={busy} />
        </View>
      ) : null}
      <ErrorTextSafe message={error} />
    </ScrollView>
  )
}

function ErrorTextSafe({ message }: { message: string | null }) {
  if (!message) return null
  return <Text style={{ color: colors.danger, marginTop: 8 }}>{message}</Text>
}

const styles = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 40, gap: 8 },
  meta: { fontSize: 12, fontWeight: "600", color: colors.navy, textTransform: "capitalize" },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.8, color: colors.ink },
  company: { fontSize: 16, fontWeight: "600", color: colors.navy, marginTop: 4 },
  pay: { fontSize: 15, color: colors.ink, marginTop: 6 },
  cat: { fontSize: 13, color: colors.faint },
  body: { marginTop: 12, fontSize: 15, lineHeight: 22, color: colors.ink },
  skills: { marginTop: 10, fontSize: 13, lineHeight: 19, color: colors.muted },
  section: {
    marginTop: 12,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.faint,
  },
  applicantName: { fontSize: 16, fontWeight: "600", color: colors.ink },
  applicantActions: { flexDirection: "row", gap: 8, marginTop: 10 },
})
