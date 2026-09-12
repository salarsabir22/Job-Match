import { safeInternalPath } from "@/lib/utils"

export type CompletenessItem = { id: string; label: string; done: boolean; href: string }

export const STUDENT_ONBOARDING_SELECT =
  "university, degree, graduation_year, skills, preferred_job_categories, linkedin_url, github_url, portfolio_url, resume_url"

export type StudentOnboardingFields = {
  university?: string | null
  degree?: string | null
  graduation_year?: number | string | null
  skills?: string[] | null
  preferred_job_categories?: string[] | null
  linkedin_url?: string | null
  github_url?: string | null
  portfolio_url?: string | null
  resume_url?: string | null
}

export function isStudentOnboardingComplete(row: StudentOnboardingFields | null | undefined) {
  if (!row) return false
  const skills = row.skills ?? []
  const categories = row.preferred_job_categories ?? []
  const hasLink = Boolean(
    row.linkedin_url?.trim() ||
      row.github_url?.trim() ||
      row.portfolio_url?.trim() ||
      row.resume_url?.trim()
  )
  return (
    Boolean(row.university?.trim()) &&
    Boolean(row.degree?.trim()) &&
    Boolean(row.graduation_year) &&
    skills.length >= 3 &&
    categories.length >= 1 &&
    hasLink
  )
}

function isDashboardPath(path: string) {
  return path === "/dashboard" || path.startsWith("/dashboard/")
}

/** Where to send a user after login. Students never land on dashboard until onboarding is done. */
export function postAuthRedirect(opts: {
  role?: string | null
  studentReady?: boolean
  next?: string | null
}) {
  const role = opts.role
  const next = safeInternalPath(opts.next)

  if (role === "admin") return next && !isDashboardPath(next) ? next : "/admin/users"
  if (role === "recruiter") return next || "/jobs"
  if (role === "student") {
    if (!opts.studentReady) return "/onboarding"
    if (next && !isDashboardPath(next) && next !== "/onboarding") return next
    return "/discover"
  }
  return "/onboarding"
}

export function studentCompleteness(opts: {
  avatar?: string | null
  bio?: string | null
  university?: string | null
  skills?: string[] | null
  resume?: string | null
  video?: string | null
  linkedin?: string | null
}): { percent: number; items: CompletenessItem[] } {
  const items: CompletenessItem[] = [
    { id: "photo", label: "Profile photo", done: Boolean(opts.avatar), href: "/onboarding" },
    { id: "bio", label: "Bio", done: Boolean(opts.bio?.trim()), href: "/onboarding" },
    { id: "school", label: "Education", done: Boolean(opts.university), href: "/onboarding" },
    { id: "skills", label: "At least 3 skills", done: (opts.skills?.length ?? 0) >= 3, href: "/onboarding" },
    { id: "resume", label: "Resume", done: Boolean(opts.resume), href: "/onboarding" },
    { id: "video", label: "Intro video", done: Boolean(opts.video), href: "/onboarding" },
    { id: "linkedin", label: "LinkedIn", done: Boolean(opts.linkedin), href: "/onboarding" },
  ]
  const done = items.filter((i) => i.done).length
  return { percent: Math.round((done / items.length) * 100), items }
}

export function recruiterCompleteness(opts: {
  logo?: string | null
  description?: string | null
  website?: string | null
  industry?: string | null
  video?: string | null
}): { percent: number; items: CompletenessItem[] } {
  const items: CompletenessItem[] = [
    { id: "logo", label: "Company logo", done: Boolean(opts.logo), href: "/onboarding" },
    { id: "about", label: "Company description", done: Boolean(opts.description?.trim()), href: "/onboarding" },
    { id: "industry", label: "Industry", done: Boolean(opts.industry), href: "/onboarding" },
    { id: "web", label: "Website", done: Boolean(opts.website), href: "/onboarding" },
    { id: "video", label: "Intro video", done: Boolean(opts.video), href: "/onboarding" },
  ]
  const done = items.filter((i) => i.done).length
  return { percent: Math.round((done / items.length) * 100), items }
}
