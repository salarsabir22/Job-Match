import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import {
  isRecruiterOnboardingComplete,
  isStudentOnboardingComplete,
} from "@/lib/completeness"

export type AppRole = "student" | "recruiter" | "admin"

export type AppProfile = {
  id: string
  role: AppRole
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  profile_video_url?: string | null
  cover_url?: string | null
}

type SessionValue = {
  ready: boolean
  session: Session | null
  profile: AppProfile | null
  studentReady: boolean
  recruiterReady: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionValue | null>(null)

async function loadProfile(userId: string) {
  let { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, full_name, avatar_url, bio, profile_video_url, cover_url")
    .eq("id", userId)
    .maybeSingle()
  if (profileError) {
    const fallback = await supabase
      .from("profiles")
      .select("id, role, full_name, avatar_url, bio")
      .eq("id", userId)
      .maybeSingle()
    profile = fallback.data as typeof profile
  }

  let studentReady = false
  let recruiterReady = false
  const role = (profile?.role as AppRole | undefined) ?? null

  if (role === "student") {
    const { data } = await supabase
      .from("student_profiles")
      .select(
        "university, degree, graduation_year, skills, preferred_job_categories, linkedin_url, github_url, portfolio_url, resume_url"
      )
      .eq("id", userId)
      .maybeSingle()
    studentReady = isStudentOnboardingComplete(data)
  }
  if (role === "recruiter") {
    const { data } = await supabase
      .from("recruiter_profiles")
      .select("company_name, description, hiring_focus")
      .eq("id", userId)
      .maybeSingle()
    recruiterReady = isRecruiterOnboardingComplete(data)
  }

  return {
    profile: (profile as AppProfile | null) ?? null,
    studentReady,
    recruiterReady,
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<AppProfile | null>(null)
  const [studentReady, setStudentReady] = useState(false)
  const [recruiterReady, setRecruiterReady] = useState(false)

  const hydrate = useCallback(async (next: Session | null) => {
    setSession(next)
    if (!next?.user) {
      setProfile(null)
      setStudentReady(false)
      setRecruiterReady(false)
      return
    }
    const loaded = await loadProfile(next.user.id)
    setProfile(loaded.profile)
    setStudentReady(loaded.studentReady)
    setRecruiterReady(loaded.recruiterReady)
  }, [])

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    await hydrate(data.session)
  }, [hydrate])

  useEffect(() => {
    let alive = true
    void (async () => {
      const { data } = await supabase.auth.getSession()
      if (!alive) return
      await hydrate(data.session)
      if (alive) setReady(true)
    })()
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      void hydrate(next)
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [hydrate])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setStudentReady(false)
    setRecruiterReady(false)
  }, [])

  const value = useMemo(
    () => ({ ready, session, profile, studentReady, recruiterReady, refresh, signOut }),
    [ready, session, profile, studentReady, recruiterReady, refresh, signOut]
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error("useSession must be used inside SessionProvider")
  return ctx
}
