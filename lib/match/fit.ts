export function skillOverlap(left: string[] | null | undefined, right: string[] | null | undefined) {
  const a = new Set((left || []).map((s) => s.trim().toLowerCase()).filter(Boolean))
  const b = (right || []).map((s) => s.trim()).filter(Boolean)
  return b.filter((s) => a.has(s.toLowerCase()))
}

export function whyThisJob(opts: {
  studentSkills?: string[] | null
  preferredCategories?: string[] | null
  jobSkills?: string[] | null
  jobCategory?: string | null
  remote?: boolean
}) {
  const reasons: string[] = []
  const skills = skillOverlap(opts.studentSkills, opts.jobSkills)
  if (skills.length) reasons.push(`${skills.slice(0, 3).join(", ")} match`)
  const cats = (opts.preferredCategories || []).map((c) => c.toLowerCase())
  if (opts.jobCategory && cats.includes(opts.jobCategory.toLowerCase())) {
    reasons.push(opts.jobCategory)
  }
  if (opts.remote) reasons.push("Remote")
  return reasons.slice(0, 3)
}

export function whyThisCandidate(opts: {
  jobSkills?: string[] | null
  candidateSkills?: string[] | null
  university?: string | null
}) {
  const reasons: string[] = []
  const skills = skillOverlap(opts.jobSkills, opts.candidateSkills)
  if (skills.length) reasons.push(`${skills.slice(0, 3).join(", ")} overlap`)
  if (opts.university) reasons.push(opts.university)
  return reasons.slice(0, 3)
}

export const PIPELINE_STATUSES = ["chatting", "interview", "offer", "hired", "passed"] as const
export type PipelineStatus = (typeof PIPELINE_STATUSES)[number]

export const PIPELINE_LABEL: Record<PipelineStatus, string> = {
  chatting: "Chatting",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  passed: "Passed",
}

export function applicationStatus(opts: {
  hasMatch: boolean
  pipeline?: string | null
  viewed?: boolean
  archived?: boolean
}) {
  if (opts.archived || opts.pipeline === "passed") return "Closed"
  if (opts.pipeline === "hired") return "Hired"
  if (opts.pipeline === "offer") return "Offer"
  if (opts.pipeline === "interview") return "Interview"
  if (opts.hasMatch) return "Chatting"
  if (opts.viewed) return "Viewed"
  return "Applied"
}
