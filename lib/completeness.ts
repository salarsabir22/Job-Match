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

export type RecruiterOnboardingFields = {
  company_name?: string | null
  description?: string | null
  hiring_focus?: string | null
}

export function isRecruiterOnboardingComplete(row: RecruiterOnboardingFields | null | undefined) {
  if (!row) return false
  return (
    Boolean(row.company_name?.trim()) &&
    (row.description?.trim().length ?? 0) >= 30 &&
    (row.hiring_focus?.trim().length ?? 0) >= 10
  )
}

export type CompletenessItem = { id: string; label: string; done: boolean }

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
    { id: "photo", label: "Profile photo", done: Boolean(opts.avatar) },
    { id: "bio", label: "Bio", done: Boolean(opts.bio?.trim()) },
    { id: "school", label: "Education", done: Boolean(opts.university) },
    { id: "skills", label: "At least 3 skills", done: (opts.skills?.length ?? 0) >= 3 },
    { id: "resume", label: "Resume", done: Boolean(opts.resume) },
    { id: "video", label: "Intro video", done: Boolean(opts.video) },
    { id: "linkedin", label: "LinkedIn", done: Boolean(opts.linkedin) },
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
    { id: "logo", label: "Company logo", done: Boolean(opts.logo) },
    { id: "about", label: "Company description", done: Boolean(opts.description?.trim()) },
    { id: "industry", label: "Industry", done: Boolean(opts.industry) },
    { id: "web", label: "Website", done: Boolean(opts.website) },
    { id: "video", label: "Intro video", done: Boolean(opts.video) },
  ]
  const done = items.filter((i) => i.done).length
  return { percent: Math.round((done / items.length) * 100), items }
}

export const JOB_CATEGORIES = [
  "Software Engineering",
  "Data Science",
  "Product Management",
  "Design",
  "Marketing",
  "Finance",
  "Operations",
  "Sales",
  "HR",
  "Consulting",
] as const
