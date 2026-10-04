import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { one } from "@/lib/one"
import { undoCandidateSwipe, undoJobSwipe } from "@/lib/swipe"
import { getBlockedPeerIds } from "@/lib/blocks"
import { notifyApplicationMilestone, recordJobView } from "@/lib/engagement"
import { Chip, EmptyState, GhostButton, PrimaryButton, Screen } from "@/components/ui"
import { MatchSheet } from "@/components/MatchSheet"
import { SwipeCard } from "@/components/SwipeCard"
import { jobFitScore, whyThisJob, candidateFitScore, whyThisCandidate } from "@/lib/fit"
import { JOB_CATEGORIES } from "@/lib/completeness"
import { JOB_TYPES } from "@/lib/format"
import { colors } from "@/lib/theme"

type JobRow = {
  id: string
  title: string
  location: string | null
  is_remote: boolean
  job_type: string
  category: string | null
  recruiter_id: string
  created_at?: string | null
  required_skills?: string[] | null
  recruiter_profiles?: { company_name?: string | null; is_approved?: boolean | null } | { company_name?: string | null; is_approved?: boolean | null }[] | null
}

type CandidateRow = {
  id: string
  university: string | null
  degree: string | null
  graduation_year: number | null
  skills: string[] | null
  profiles?: { full_name?: string | null; bio?: string | null } | { full_name?: string | null; bio?: string | null }[] | null
}

export default function DiscoverScreen() {
  const { session, profile } = useSession()
  const recruiter = profile?.role === "recruiter"
  if (recruiter) return <RecruiterDiscover userId={session!.user.id} />
  return <StudentDiscover userId={session!.user.id} />
}

function StudentDiscover({ userId }: { userId: string }) {
  const router = useRouter()
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [last, setLast] = useState<JobRow | null>(null)
  const [jobType, setJobType] = useState("all")
  const [remote, setRemote] = useState("all")
  const [category, setCategory] = useState("all")
  const [city, setCity] = useState("")
  const [prefs, setPrefs] = useState<{ skills: string[]; cats: string[] }>({ skills: [], cats: [] })
  const [match, setMatch] = useState<{ name: string; chat?: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [{ data: swipes }, blocked, { data: student }] = await Promise.all([
      supabase.from("job_swipes").select("job_id").eq("student_id", userId),
      getBlockedPeerIds(supabase, userId),
      supabase.from("student_profiles").select("skills, preferred_job_categories").eq("id", userId).maybeSingle(),
    ])
    setPrefs({ skills: student?.skills || [], cats: student?.preferred_job_categories || [] })
    const swiped = new Set((swipes ?? []).map((s) => s.job_id as string))
    const { data, error: loadError } = await supabase
      .from("jobs")
      .select("id, title, location, is_remote, job_type, category, recruiter_id, created_at, required_skills, recruiter_profiles(company_name, is_approved)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(40)
    if (loadError) {
      setError(loadError.message)
      setLoading(false)
      return
    }
    const rows = ((data ?? []) as JobRow[]).filter((job) => {
      if (swiped.has(job.id) || blocked.has(job.recruiter_id)) return false
      return one(job.recruiter_profiles)?.is_approved === true
    })
    setJobs(rows)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  const swipe = async (direction: "right" | "left" | "saved") => {
    const job = visible[0]
    if (!job || busy) return
    setBusy(true)
    const { error: swipeError } = await supabase.from("job_swipes").insert({
      student_id: userId,
      job_id: job.id,
      direction,
    })
    if (swipeError && !swipeError.message.toLowerCase().includes("duplicate")) {
      setError(swipeError.message)
      setBusy(false)
      return
    }
    setLast(job)
    setJobs((prev) => prev.filter((j) => j.id !== job.id))
    setBusy(false)
    if (direction === "right") {
      await notifyApplicationMilestone(supabase, { jobId: job.id, recruiterId: job.recruiter_id, jobTitle: job.title })
      const { data: match } = await supabase
        .from("matches")
        .select("id, conversations(id)")
        .eq("student_id", userId)
        .eq("job_id", job.id)
        .maybeSingle()
      const convo = one(match?.conversations)?.id
      if (match) {
        setMatch({ name: one(job.recruiter_profiles)?.company_name || job.title, chat: convo })
      }
    }
  }

  const undo = async () => {
    if (!last || busy) return
    setBusy(true)
    const result = await undoJobSwipe(supabase, {
      studentId: userId,
      recruiterId: last.recruiter_id,
      jobId: last.id,
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.message || "Couldn’t undo")
      return
    }
    setJobs((prev) => [last, ...prev])
    setLast(null)
  }

  const visible = jobs
    .filter((j) => {
      if (jobType !== "all" && j.job_type !== jobType) return false
      if (remote === "remote" && !j.is_remote) return false
      if (remote === "onsite" && j.is_remote) return false
      if (category !== "all" && j.category !== category) return false
      if (city.trim() && !(j.location || "").toLowerCase().includes(city.trim().toLowerCase())) return false
      return true
    })
    .sort(
      (a, b) =>
        jobFitScore({
          studentSkills: prefs.skills,
          preferredCategories: prefs.cats,
          jobSkills: b.required_skills,
          jobCategory: b.category,
          remote: b.is_remote,
          createdAt: b.created_at,
        }) -
        jobFitScore({
          studentSkills: prefs.skills,
          preferredCategories: prefs.cats,
          jobSkills: a.required_skills,
          jobCategory: a.category,
          remote: a.is_remote,
          createdAt: a.created_at,
        })
    )
  const current = visible[0]
  const company = current ? one(current.recruiter_profiles)?.company_name : null

  useEffect(() => {
    if (!current) return
    void recordJobView(supabase, {
      studentId: userId,
      jobId: current.id,
      recruiterId: current.recruiter_id,
      jobTitle: current.title,
    })
  }, [current?.id, userId])

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.head}>
          <Text style={styles.kicker}>Discover</Text>
          <Text style={styles.title}>Roles that want a yes from you too</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jobChips}>
          <Chip label="All types" selected={jobType === "all"} onPress={() => setJobType("all")} />
          {JOB_TYPES.map((t) => (
            <Chip key={t.value} label={t.label} selected={jobType === t.value} onPress={() => setJobType(t.value)} />
          ))}
          <Chip label="Any location" selected={remote === "all"} onPress={() => setRemote("all")} />
          <Chip label="Remote" selected={remote === "remote"} onPress={() => setRemote("remote")} />
          <Chip label="On-site" selected={remote === "onsite"} onPress={() => setRemote("onsite")} />
          <Chip label="All categories" selected={category === "all"} onPress={() => setCategory("all")} />
          {JOB_CATEGORIES.map((c) => (
            <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </ScrollView>
        <View style={{ paddingHorizontal: 22, paddingBottom: 8 }}>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="City"
            placeholderTextColor="rgba(0,0,0,0.32)"
            style={styles.filterInput}
          />
        </View>
        {loading ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: 40 }} />
        ) : error ? (
          <EmptyState title="Couldn’t load roles" body={error} />
        ) : !current ? (
          <EmptyState title="You’re caught up" body="No more roles match these filters. Clear them or check back after you refresh." />
        ) : (
          <View style={styles.cardWrap}>
            <SwipeCard
              disabled={busy}
              onPass={() => void swipe("left")}
              onSave={() => void swipe("saved")}
              onYes={() => void swipe("right")}
            >
              <Pressable onPress={() => router.push(`/job/${current.id}`)} style={styles.card}>
                <Text style={styles.meta}>
                  {(current.job_type || "role").replace(/_/g, " ")}
                  {current.is_remote ? " · Remote" : current.location ? ` · ${current.location}` : ""}
                </Text>
                <Text style={styles.jobTitle}>{current.title}</Text>
                {company ? <Text style={styles.company}>{company}</Text> : null}
                {current.category ? <Text style={styles.cat}>{current.category}</Text> : null}
                {whyThisJob({
                  studentSkills: prefs.skills,
                  preferredCategories: prefs.cats,
                  jobSkills: current.required_skills,
                  jobCategory: current.category,
                  createdAt: current.created_at,
                }).length ? (
                  <Text style={styles.cat}>
                    {whyThisJob({
                      studentSkills: prefs.skills,
                      preferredCategories: prefs.cats,
                      jobSkills: current.required_skills,
                      jobCategory: current.category,
                      createdAt: current.created_at,
                    }).join(" · ")}
                  </Text>
                ) : null}
                <Text style={styles.cat}>Swipe right to apply · left to pass · up to save</Text>
              </Pressable>
            </SwipeCard>
            <View style={styles.actions}>
              <Pressable onPress={() => void swipe("left")} disabled={busy} style={[styles.ghost, busy && { opacity: 0.5 }]}>
                <Text style={styles.ghostLabel}>Pass</Text>
              </Pressable>
              <Pressable onPress={() => void swipe("saved")} disabled={busy} style={[styles.ghost, busy && { opacity: 0.5 }]}>
                <Text style={styles.ghostLabel}>Save</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Interested" loading={busy} onPress={() => void swipe("right")} />
              </View>
            </View>
            {last ? <GhostButton label="Undo last" onPress={() => void undo()} disabled={busy} /> : null}
          </View>
        )}
        <MatchSheet
          open={Boolean(match)}
          name={match?.name || "them"}
          onChat={match?.chat ? () => { const href = match.chat; setMatch(null); if (href) router.push(`/chat/${href}`) } : undefined}
          onDismiss={() => setMatch(null)}
        />
      </SafeAreaView>
    </Screen>
  )
}

function RecruiterDiscover({ userId }: { userId: string }) {
  const router = useRouter()
  const [jobs, setJobs] = useState<{ id: string; title: string; required_skills?: string[] | null }[]>([])
  const [jobId, setJobId] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<CandidateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [last, setLast] = useState<CandidateRow | null>(null)
  const [university, setUniversity] = useState("")
  const [gradYear, setGradYear] = useState("")
  const [skillQuery, setSkillQuery] = useState("")
  const [match, setMatch] = useState<{ name: string; chat?: string } | null>(null)

  const loadJobs = useCallback(async () => {
    const { data } = await supabase.from("jobs").select("id, title, required_skills").eq("recruiter_id", userId).eq("is_active", true)
    const list = (data ?? []) as { id: string; title: string; required_skills?: string[] | null }[]
    setJobs(list)
    setJobId(list[0]?.id ?? null)
  }, [userId])

  const loadCandidates = useCallback(async (selected: string) => {
    setLoading(true)
    setError(null)
    const [{ data: swipedRows }, { data: applyRows }, blocked] = await Promise.all([
      supabase.from("candidate_swipes").select("student_id").eq("recruiter_id", userId).eq("job_id", selected),
      supabase.from("job_swipes").select("student_id").eq("job_id", selected).eq("direction", "right"),
      getBlockedPeerIds(supabase, userId),
    ])
    const swiped = new Set((swipedRows ?? []).map((r) => r.student_id as string))
    const applied = [...new Set((applyRows ?? []).map((r) => r.student_id as string))].filter(
      (id) => !swiped.has(id) && id !== userId && !blocked.has(id)
    )
    if (!applied.length) {
      setCandidates([])
      setLoading(false)
      return
    }
    const { data, error: loadError } = await supabase
      .from("student_profiles")
      .select("id, university, degree, graduation_year, skills, profiles!inner(full_name, bio)")
      .in("id", applied.slice(0, 40))
    if (loadError) {
      setError(loadError.message)
      setLoading(false)
      return
    }
    setCandidates((data ?? []) as CandidateRow[])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void loadJobs()
  }, [loadJobs])

  useEffect(() => {
    if (jobId) void loadCandidates(jobId)
    else setLoading(false)
  }, [jobId, loadCandidates])

  const swipe = async (direction: "right" | "left") => {
    const person = visible[0]
    if (!person || !jobId || busy) return
    setBusy(true)
    const { error: swipeError } = await supabase.from("candidate_swipes").insert({
      recruiter_id: userId,
      student_id: person.id,
      job_id: jobId,
      direction,
    })
    if (swipeError && !swipeError.message.toLowerCase().includes("duplicate")) {
      setError(swipeError.message)
      setBusy(false)
      return
    }
    setCandidates((prev) => prev.filter((c) => c.id !== person.id))
    setLast(person)
    setBusy(false)
    if (direction === "right") {
      const { data: matchRow } = await supabase
        .from("matches")
        .select("id, conversations(id)")
        .eq("recruiter_id", userId)
        .eq("student_id", person.id)
        .eq("job_id", jobId)
        .maybeSingle()
      const convo = one(matchRow?.conversations)?.id
      if (matchRow) {
        setMatch({ name: one(person.profiles)?.full_name || "Student", chat: convo })
      }
    }
  }

  const undo = async () => {
    if (!last || !jobId || busy) return
    setBusy(true)
    const result = await undoCandidateSwipe(supabase, {
      studentId: last.id,
      recruiterId: userId,
      jobId,
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.message || "Couldn’t undo")
      return
    }
    setCandidates((prev) => [last, ...prev])
    setLast(null)
  }

  const jobSkills = jobs.find((j) => j.id === jobId)?.required_skills || []
  const visible = candidates
    .filter((c) => {
      if (university.trim() && !(c.university || "").toLowerCase().includes(university.trim().toLowerCase())) return false
      if (gradYear.trim() && String(c.graduation_year || "") !== gradYear.trim()) return false
      if (skillQuery.trim()) {
        const q = skillQuery.trim().toLowerCase()
        if (!(c.skills || []).some((s) => s.toLowerCase().includes(q))) return false
      }
      return true
    })
    .sort(
      (a, b) =>
        candidateFitScore({ jobSkills, candidateSkills: b.skills, applied: true }) -
        candidateFitScore({ jobSkills, candidateSkills: a.skills, applied: true })
    )
  const current = visible[0]
  const person = current ? one(current.profiles) : null

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.head}>
          <Text style={styles.kicker}>Discover</Text>
          <Text style={styles.title}>People who already raised a hand</Text>
        </View>
        {jobs.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jobChips}>
            {jobs.map((job) => (
              <Pressable
                key={job.id}
                onPress={() => setJobId(job.id)}
                style={[styles.chip, jobId === job.id && styles.chipOn]}
              >
                <Text style={[styles.chipText, jobId === job.id && { color: colors.white }]} numberOfLines={1}>
                  {job.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
        {jobs.length ? (
          <View style={{ paddingHorizontal: 22, gap: 8, paddingBottom: 8 }}>
            <TextInput
              value={university}
              onChangeText={setUniversity}
              placeholder="University"
              placeholderTextColor="rgba(0,0,0,0.32)"
              style={styles.filterInput}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                value={gradYear}
                onChangeText={(v) => setGradYear(v.replace(/[^\d]/g, "").slice(0, 4))}
                placeholder="Grad year"
                placeholderTextColor="rgba(0,0,0,0.32)"
                keyboardType="number-pad"
                style={[styles.filterInput, { flex: 1 }]}
              />
              <TextInput
                value={skillQuery}
                onChangeText={setSkillQuery}
                placeholder="Skill"
                placeholderTextColor="rgba(0,0,0,0.32)"
                style={[styles.filterInput, { flex: 1 }]}
              />
            </View>
          </View>
        ) : null}
        {!jobs.length ? (
          <View style={{ paddingHorizontal: 22, gap: 12 }}>
            <EmptyState title="Post a role first" body="Create a listing, then swipe students who applied." />
            <PrimaryButton label="Post a job" onPress={() => router.push("/job/new")} />
          </View>
        ) : loading ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: 40 }} />
        ) : error ? (
          <EmptyState title="Couldn’t load candidates" body={error} />
        ) : !current ? (
          <EmptyState title="No raised hands yet" body="When students swipe right on this listing, they’ll show up here. Clear filters if you narrowed the stack." />
        ) : (
          <View style={styles.cardWrap}>
            <SwipeCard disabled={busy} onPass={() => void swipe("left")} onYes={() => void swipe("right")}>
              <Pressable onPress={() => router.push(`/candidate/${current.id}`)} style={styles.card}>
                <Text style={styles.jobTitle}>{person?.full_name || "Student"}</Text>
                <Text style={styles.company}>
                  {[current.degree, current.university, current.graduation_year].filter(Boolean).join(" · ")}
                </Text>
                {person?.bio ? <Text style={styles.bio}>{person.bio}</Text> : null}
                {current.skills?.length ? <Text style={styles.cat}>{current.skills.slice(0, 8).join(" · ")}</Text> : null}
                {whyThisCandidate({ jobSkills, candidateSkills: current.skills, applied: true }).length ? (
                  <Text style={styles.cat}>
                    {whyThisCandidate({ jobSkills, candidateSkills: current.skills, applied: true }).join(" · ")}
                  </Text>
                ) : null}
                <Text style={styles.cat}>Swipe right to shortlist · left to pass</Text>
              </Pressable>
            </SwipeCard>
            <View style={styles.actions}>
              <Pressable onPress={() => void swipe("left")} disabled={busy} style={[styles.ghost, busy && { opacity: 0.5 }]}>
                <Text style={styles.ghostLabel}>Pass</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Shortlist" loading={busy} onPress={() => void swipe("right")} />
              </View>
            </View>
            {last ? <GhostButton label="Undo last" onPress={() => void undo()} disabled={busy} /> : null}
          </View>
        )}
        <MatchSheet
          open={Boolean(match)}
          name={match?.name || "them"}
          onChat={
            match?.chat
              ? () => {
                  const href = match.chat
                  setMatch(null)
                  if (href) router.push(`/chat/${href}`)
                }
              : undefined
          }
          onDismiss={() => setMatch(null)}
        />
      </SafeAreaView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  head: {
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
    maxWidth: 280,
  },
  cardWrap: {
    flex: 1,
    paddingHorizontal: 22,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  card: {
    marginTop: 12,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 22,
    minHeight: 220,
  },
  meta: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.navy,
    textTransform: "capitalize",
  },
  jobTitle: {
    marginTop: 10,
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.7,
    color: colors.ink,
  },
  company: {
    marginTop: 8,
    fontSize: 15,
    color: colors.muted,
  },
  cat: {
    marginTop: 16,
    fontSize: 13,
    color: colors.faint,
  },
  bio: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ghost: {
    minHeight: 48,
    paddingHorizontal: 20,
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
  jobChips: {
    paddingHorizontal: 22,
    gap: 8,
    paddingBottom: 8,
  },
  chip: {
    maxWidth: 200,
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
  filterInput: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.ink,
  },
})
