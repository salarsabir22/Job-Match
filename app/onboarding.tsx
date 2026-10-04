import { useState } from "react"
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { Redirect, useRouter } from "expo-router"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { JOB_CATEGORIES } from "@/lib/completeness"
import { COMPANY_INDUSTRIES } from "@/lib/company-options"
import { PAKISTANI_UNIVERSITIES, UNIVERSITY_OTHER } from "@/lib/pakistan-universities"
import { ErrorText, Field, GhostButton, PrimaryButton, Screen } from "@/components/ui"
import { SearchablePick } from "@/components/SearchablePick"
import { colors } from "@/lib/theme"
import { extFromType, pickDocument, pickImage, pickVideo, uploadUri } from "@/lib/upload"

export default function OnboardingScreen() {
  const router = useRouter()
  const { ready, session, profile, studentReady, recruiterReady, refresh } = useSession()
  const [university, setUniversity] = useState("")
  const [degree, setDegree] = useState("")
  const [year, setYear] = useState("")
  const [skills, setSkills] = useState("")
  const [category, setCategory] = useState<(typeof JOB_CATEGORIES)[number]>(JOB_CATEGORIES[0])
  const [linkedin, setLinkedin] = useState("")
  const [github, setGithub] = useState("")
  const [portfolio, setPortfolio] = useState("")
  const [company, setCompany] = useState("")
  const [description, setDescription] = useState("")
  const [focus, setFocus] = useState("")
  const [website, setWebsite] = useState("")
  const [industry, setIndustry] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [photoDone, setPhotoDone] = useState(false)
  const [resumeDone, setResumeDone] = useState(false)
  const [logoDone, setLogoDone] = useState(false)
  const [videoDone, setVideoDone] = useState(false)

  if (ready && !session) return <Redirect href="/login" />
  if (ready && profile?.role === "student" && studentReady) return <Redirect href="/discover" />
  if (ready && profile?.role === "recruiter" && recruiterReady) return <Redirect href="/discover" />

  const role = profile?.role ?? "student"
  const userId = session?.user.id

  const saveStudent = async () => {
    if (!userId) return
    const skillList = skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    if (!university.trim() || !degree.trim() || !year.trim() || skillList.length < 3 || !(linkedin.trim() || github.trim() || portfolio.trim())) {
      setError("University, degree, year, at least 3 skills, and a LinkedIn (or other) link are required.")
      return
    }
    setLoading(true)
    setError(null)
    const row = {
      id: userId,
      university: university.trim(),
      degree: degree.trim(),
      graduation_year: parseInt(year, 10) || null,
      skills: skillList,
      preferred_job_categories: [category],
      linkedin_url: linkedin.trim() || null,
      github_url: github.trim() || null,
      portfolio_url: portfolio.trim() || null,
    }
    const { data: updated } = await supabase.from("student_profiles").update(row).eq("id", userId).select("id")
    if (!updated?.length) {
      const { error: insertError } = await supabase.from("student_profiles").insert(row)
      if (insertError) {
        setLoading(false)
        setError(insertError.message)
        return
      }
    }
    await refresh()
    setLoading(false)
    router.replace("/discover")
  }

  const saveRecruiter = async () => {
    if (!userId) return
    if (!company.trim() || description.trim().length < 30 || focus.trim().length < 10) {
      setError("Company name, a 30+ character description, and hiring focus are required.")
      return
    }
    setLoading(true)
    setError(null)
    const row = {
      id: userId,
      company_name: company.trim(),
      description: description.trim(),
      hiring_focus: focus.trim(),
      website_url: website.trim() || null,
      industry: industry.trim() || null,
    }
    const { data: updated } = await supabase.from("recruiter_profiles").update(row).eq("id", userId).select("id")
    if (!updated?.length) {
      let { error: insertError } = await supabase.from("recruiter_profiles").insert(row)
      if (insertError && (website.trim() || industry.trim())) {
        const { website_url: _w, industry: _i, ...base } = row
        insertError = (await supabase.from("recruiter_profiles").insert(base)).error
      }
      if (insertError) {
        setLoading(false)
        setError(insertError.message)
        return
      }
    }
    await refresh()
    setLoading(false)
    router.replace("/discover")
  }

  const uploadPhoto = async () => {
    if (!userId) return
    try {
      const picked = await pickImage()
      if (!picked) return
      setUploading("photo")
      const ext = extFromType(picked.contentType, "jpg")
      const url = await uploadUri({
        bucket: "avatars",
        path: `${userId}/avatar.${ext}`,
        uri: picked.uri,
        contentType: picked.contentType,
      })
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId)
      setPhotoDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t upload photo")
    }
    setUploading(null)
  }

  const uploadResume = async () => {
    if (!userId) return
    try {
      const picked = await pickDocument()
      if (!picked) return
      setUploading("resume")
      const ext = extFromType(picked.contentType, "pdf")
      const path = `${userId}/resume.${ext}`
      await uploadUri({
        bucket: "resumes",
        path,
        uri: picked.uri,
        contentType: picked.contentType,
      })
      await supabase.from("student_profiles").update({ resume_url: path }).eq("id", userId)
      setResumeDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t upload resume")
    }
    setUploading(null)
  }

  const uploadLogo = async () => {
    if (!userId) return
    try {
      const picked = await pickImage()
      if (!picked) return
      setUploading("logo")
      const ext = extFromType(picked.contentType, "jpg")
      const url = await uploadUri({
        bucket: "logos",
        path: `${userId}/logo.${ext}`,
        uri: picked.uri,
        contentType: picked.contentType,
      })
      await supabase.from("recruiter_profiles").update({ logo_url: url }).eq("id", userId)
      setLogoDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t upload logo")
    }
    setUploading(null)
  }

  const uploadIntro = async () => {
    if (!userId) return
    try {
      const picked = await pickVideo()
      if (!picked) return
      setUploading("video")
      const ext = extFromType(picked.contentType, "mp4")
      const url = await uploadUri({
        bucket: "profile-videos",
        path: `${userId}/intro.${ext}`,
        uri: picked.uri,
        contentType: picked.contentType,
      })
      await supabase.from("profiles").update({ profile_video_url: url }).eq("id", userId)
      setVideoDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t upload intro")
    }
    setUploading(null)
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
          <Text style={styles.kicker}>Finish profile</Text>
          <Text style={styles.title}>
            {role === "recruiter" ? "Tell students who you hire" : "A few details so roles can find you"}
          </Text>
          {role === "recruiter" ? (
            <View style={{ gap: 14, marginTop: 24 }}>
              <Field label="Company" value={company} onChangeText={setCompany} autoCapitalize="words" />
              <Field
                label="About the team"
                value={description}
                onChangeText={setDescription}
                autoCapitalize="sentences"
                multiline
                style={{ minHeight: 96, textAlignVertical: "top", paddingTop: 12 }}
              />
              <Field label="Hiring focus" value={focus} onChangeText={setFocus} autoCapitalize="sentences" />
              <SearchablePick
                label="Industry"
                value={industry}
                onChange={setIndustry}
                options={COMPANY_INDUSTRIES}
              />
              <Field label="Website" value={website} onChangeText={setWebsite} />
              <GhostButton
                label={uploading === "logo" ? "Uploading logo…" : logoDone ? "Logo added" : "Upload logo"}
                onPress={() => void uploadLogo()}
                disabled={Boolean(uploading)}
              />
              <GhostButton
                label={uploading === "video" ? "Uploading intro…" : videoDone ? "Intro added" : "Intro video (optional)"}
                onPress={() => void uploadIntro()}
                disabled={Boolean(uploading)}
              />
            </View>
          ) : (
            <View style={{ gap: 14, marginTop: 24 }}>
              <SearchablePick
                label="University"
                value={university}
                onChange={setUniversity}
                options={PAKISTANI_UNIVERSITIES}
                otherLabel={UNIVERSITY_OTHER}
                placeholder="Search any university in Pakistan"
              />
              <Field label="Degree" value={degree} onChangeText={setDegree} autoCapitalize="words" />
              <Field label="Graduation year" value={year} onChangeText={setYear} keyboardType="number-pad" />
              <Field
                label="Skills (comma separated, at least 3)"
                value={skills}
                onChangeText={setSkills}
                autoCapitalize="words"
              />
              <Text style={styles.catLabel}>Preferred category</Text>
              <View style={styles.chips}>
                {JOB_CATEGORIES.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setCategory(item)}
                    style={[styles.chip, category === item && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, category === item && { color: colors.white }]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
              <Field
                label="LinkedIn URL"
                value={linkedin}
                onChangeText={setLinkedin}
                autoCapitalize="none"
                keyboardType="url"
              />
              <Field label="GitHub URL (optional)" value={github} onChangeText={setGithub} autoCapitalize="none" />
              <Field label="Portfolio URL (optional)" value={portfolio} onChangeText={setPortfolio} autoCapitalize="none" />
              <GhostButton
                label={uploading === "photo" ? "Uploading photo…" : photoDone ? "Photo added" : "Profile photo"}
                onPress={() => void uploadPhoto()}
                disabled={Boolean(uploading)}
              />
              <GhostButton
                label={uploading === "resume" ? "Uploading resume…" : resumeDone ? "Resume added" : "Resume (optional)"}
                onPress={() => void uploadResume()}
                disabled={Boolean(uploading)}
              />
              <GhostButton
                label={uploading === "video" ? "Uploading intro…" : videoDone ? "Intro added" : "Intro video (optional)"}
                onPress={() => void uploadIntro()}
                disabled={Boolean(uploading)}
              />
            </View>
          )}
          <View style={{ marginTop: 22, gap: 12 }}>
            <ErrorText message={error} />
            <PrimaryButton
              label="Continue"
              loading={loading}
              onPress={() => void (role === "recruiter" ? saveRecruiter() : saveStudent())}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 22,
    paddingTop: 64,
    paddingBottom: 40,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: colors.faint,
  },
  title: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.8,
    color: colors.ink,
    maxWidth: 320,
  },
  catLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.faint,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
