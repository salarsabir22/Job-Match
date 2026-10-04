import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, Text, View } from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import * as Linking from "expo-linking"
import { createSessionFromUrl } from "@/lib/oauth"
import { supabase } from "@/lib/supabase"
import { isRecruiterOnboardingComplete, isStudentOnboardingComplete } from "@/lib/completeness"
import { colors } from "@/lib/theme"

async function afterAuth(userId: string) {
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
  if (profile?.role === "admin") return "/admin"
  if (profile?.role === "student") {
    const { data } = await supabase
      .from("student_profiles")
      .select(
        "university, degree, graduation_year, skills, preferred_job_categories, linkedin_url, github_url, portfolio_url, resume_url"
      )
      .eq("id", userId)
      .maybeSingle()
    return isStudentOnboardingComplete(data) ? "/discover" : "/onboarding"
  }
  if (profile?.role === "recruiter") {
    const { data } = await supabase
      .from("recruiter_profiles")
      .select("company_name, description, hiring_focus")
      .eq("id", userId)
      .maybeSingle()
    return isRecruiterOnboardingComplete(data) ? "/discover" : "/onboarding"
  }
  return "/onboarding"
}

export default function AuthCallbackScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async () => {
    try {
      const type = typeof params.type === "string" ? params.type : ""
      const access = typeof params.access_token === "string" ? params.access_token : ""
      const refresh = typeof params.refresh_token === "string" ? params.refresh_token : ""
      const code = typeof params.code === "string" ? params.code : ""
      if (code || access) {
        const q = new URLSearchParams()
        if (code) q.set("code", code)
        if (access) q.set("access_token", access)
        if (refresh) q.set("refresh_token", refresh)
        if (type) q.set("type", type)
        await createSessionFromUrl(`jobmatch://auth/callback?${q.toString()}`)
      } else {
        const href = typeof params.url === "string" ? params.url : (await Linking.getInitialURL()) || undefined
        if (href) await createSessionFromUrl(href)
      }
      if (type === "recovery") {
        router.replace("/reset-password")
        return
      }
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.replace("/login")
        return
      }
      const next = await afterAuth(data.session.user.id)
      router.replace(next as never)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed")
    }
  }, [params, router])

  useEffect(() => {
    void run()
  }, [run])

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.ink, padding: 24 }}>
      <ActivityIndicator color={colors.white} />
      {error ? <Text style={{ color: colors.white, marginTop: 16, textAlign: "center" }}>{error}</Text> : null}
    </View>
  )
}
