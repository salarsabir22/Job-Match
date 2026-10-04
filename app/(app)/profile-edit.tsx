import { useCallback, useEffect, useState } from "react"
import { ScrollView, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { supabase } from "@/lib/supabase"
import { useSession } from "@/lib/session"
import { JOB_CATEGORIES } from "@/lib/completeness"
import { COMPANY_INDUSTRIES } from "@/lib/company-options"
import { PAKISTANI_UNIVERSITIES, UNIVERSITY_OTHER } from "@/lib/pakistan-universities"
import { ErrorText, Field, GhostButton, PrimaryButton } from "@/components/ui"
import { SearchablePick } from "@/components/SearchablePick"
import { Pressable, Text, View } from "react-native"
import { colors } from "@/lib/theme"
import { extFromType, pickDocument, pickImage, pickVideo, uploadUri } from "@/lib/upload"

export default function ProfileEditScreen() {
  const router = useRouter()
  const { session, profile, refresh } = useSession()
  const recruiter = profile?.role === "recruiter"
  const [fullName, setFullName] = useState(profile?.full_name || "")
  const [bio, setBio] = useState(profile?.bio || "")
  const [university, setUniversity] = useState("")
  const [degree, setDegree] = useState("")
  const [year, setYear] = useState("")
  const [skills, setSkills] = useState("")
  const [category, setCategory] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [github, setGithub] = useState("")
  const [portfolio, setPortfolio] = useState("")
  const [company, setCompany] = useState("")
  const [description, setDescription] = useState("")
  const [focus, setFocus] = useState("")
  const [website, setWebsite] = useState("")
  const [industry, setIndustry] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)

  const load = useCallback(async () => {
    const userId = session!.user.id
    if (recruiter) {
      const { data } = await supabase
        .from("recruiter_profiles")
        .select("company_name, description, hiring_focus, website_url, industry")
        .eq("id", userId)
        .maybeSingle()
      setCompany(data?.company_name || "")
      setDescription(data?.description || "")
      setFocus(data?.hiring_focus || "")
      setWebsite(data?.website_url || "")
      setIndustry(data?.industry || "")
    } else {
      const { data } = await supabase
        .from("student_profiles")
        .select("university, degree, graduation_year, skills, preferred_job_categories, linkedin_url, github_url, portfolio_url")
        .eq("id", userId)
        .maybeSingle()
      setUniversity(data?.university || "")
      setDegree(data?.degree || "")
      setYear(data?.graduation_year ? String(data.graduation_year) : "")
      setSkills((data?.skills || []).join(", "))
      setCategory((data?.preferred_job_categories || [])[0] || "")
      setLinkedin(data?.linkedin_url || "")
      setGithub(data?.github_url || "")
      setPortfolio(data?.portfolio_url || "")
    }
  }, [recruiter, session])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    const userId = session!.user.id
    setSaving(true)
    setError(null)
    await supabase.from("profiles").update({ full_name: fullName.trim() || null, bio: bio.trim() || null }).eq("id", userId)
    const recError = recruiter
      ? (
          await supabase
            .from("recruiter_profiles")
            .update({
              company_name: company.trim(),
              description: description.trim(),
              hiring_focus: focus.trim(),
              website_url: website.trim() || null,
              industry: industry.trim() || null,
            })
            .eq("id", userId)
        ).error
      : (
          await supabase
            .from("student_profiles")
            .update({
              university: university.trim(),
              degree: degree.trim(),
              graduation_year: year ? parseInt(year, 10) : null,
              skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
              preferred_job_categories: category ? [category] : [],
              linkedin_url: linkedin.trim() || null,
              github_url: github.trim() || null,
              portfolio_url: portfolio.trim() || null,
            })
            .eq("id", userId)
        ).error
    await refresh()
    setSaving(false)
    if (recError) {
      setError(recError.message)
      return
    }
    router.back()
  }

  const uploadAvatar = async () => {
    try {
      const picked = await pickImage()
      if (!picked) return
      setUploading("photo")
      const ext = extFromType(picked.contentType, "jpg")
      const url = await uploadUri({
        bucket: "avatars",
        path: `${session!.user.id}/avatar.${ext}`,
        uri: picked.uri,
        contentType: picked.contentType,
      })
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", session!.user.id)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t upload photo")
    }
    setUploading(null)
  }

  const uploadCover = async () => {
    try {
      const picked = await pickImage()
      if (!picked) return
      setUploading("cover")
      const ext = extFromType(picked.contentType, "jpg")
      const url = await uploadUri({
        bucket: "avatars",
        path: `${session!.user.id}/cover.${ext}`,
        uri: picked.uri,
        contentType: picked.contentType,
      })
      await supabase.from("profiles").update({ cover_url: url }).eq("id", session!.user.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t upload cover")
    }
    setUploading(null)
  }

  const uploadLogo = async () => {
    try {
      const picked = await pickImage()
      if (!picked) return
      setUploading("logo")
      const ext = extFromType(picked.contentType, "jpg")
      const url = await uploadUri({
        bucket: "logos",
        path: `${session!.user.id}/logo.${ext}`,
        uri: picked.uri,
        contentType: picked.contentType,
      })
      await supabase.from("recruiter_profiles").update({ logo_url: url }).eq("id", session!.user.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t upload logo")
    }
    setUploading(null)
  }

  const uploadResume = async () => {
    try {
      const picked = await pickDocument()
      if (!picked) return
      setUploading("resume")
      const ext = extFromType(picked.contentType, "pdf")
      const path = `${session!.user.id}/resume.${ext}`
      await uploadUri({
        bucket: "resumes",
        path,
        uri: picked.uri,
        contentType: picked.contentType,
      })
      await supabase.from("student_profiles").update({ resume_url: path }).eq("id", session!.user.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t upload resume")
    }
    setUploading(null)
  }

  const uploadVideo = async () => {
    try {
      const picked = await pickVideo()
      if (!picked) return
      setUploading("video")
      const ext = extFromType(picked.contentType, "mp4")
      const url = await uploadUri({
        bucket: "profile-videos",
        path: `${session!.user.id}/intro.${ext}`,
        uri: picked.uri,
        contentType: picked.contentType,
      })
      await supabase.from("profiles").update({ profile_video_url: url }).eq("id", session!.user.id)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t upload intro")
    }
    setUploading(null)
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Field label="Name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
      <Field
        label="Bio"
        value={bio}
        onChangeText={setBio}
        multiline
        autoCapitalize="sentences"
        style={{ minHeight: 88, textAlignVertical: "top", paddingTop: 12 }}
      />
      <GhostButton label={uploading === "photo" ? "Uploading photo…" : "Upload photo"} onPress={() => void uploadAvatar()} disabled={Boolean(uploading)} />
      <GhostButton label={uploading === "cover" ? "Uploading cover…" : "Upload cover"} onPress={() => void uploadCover()} disabled={Boolean(uploading)} />
      <GhostButton label={uploading === "video" ? "Uploading intro…" : "Upload intro video"} onPress={() => void uploadVideo()} disabled={Boolean(uploading)} />
      {recruiter ? (
        <>
          <Field label="Company" value={company} onChangeText={setCompany} autoCapitalize="words" />
          <Field
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            autoCapitalize="sentences"
            style={{ minHeight: 88, textAlignVertical: "top", paddingTop: 12 }}
          />
          <Field label="Hiring focus" value={focus} onChangeText={setFocus} autoCapitalize="sentences" />
          <SearchablePick label="Industry" value={industry} onChange={setIndustry} options={COMPANY_INDUSTRIES} />
          <Field label="Website" value={website} onChangeText={setWebsite} />
          <GhostButton label={uploading === "logo" ? "Uploading logo…" : "Upload logo"} onPress={() => void uploadLogo()} disabled={Boolean(uploading)} />
        </>
      ) : (
        <>
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
          <Field label="Skills" value={skills} onChangeText={setSkills} autoCapitalize="words" />
          <View style={styles.chips}>
            {JOB_CATEGORIES.map((c) => (
              <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipOn]}>
                <Text style={[styles.chipText, category === c && { color: colors.white }]}>{c}</Text>
              </Pressable>
            ))}
          </View>
          <Field label="LinkedIn" value={linkedin} onChangeText={setLinkedin} />
          <Field label="GitHub" value={github} onChangeText={setGithub} />
          <Field label="Portfolio" value={portfolio} onChangeText={setPortfolio} />
          <GhostButton label={uploading === "resume" ? "Uploading resume…" : "Upload resume"} onPress={() => void uploadResume()} disabled={Boolean(uploading)} />
        </>
      )}
      <ErrorText message={error} />
      <PrimaryButton label="Save" loading={saving} onPress={() => void save()} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  wrap: { padding: 20, gap: 14, paddingBottom: 40 },
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
})
