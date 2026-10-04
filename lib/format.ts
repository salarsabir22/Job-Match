export const JOB_TYPES = [
  { value: "internship", label: "Internship" },
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
] as const

export const PIPELINE_STAGES = ["chatting", "interview", "offer", "hired"] as const
export const PIPELINE_TABS = ["chatting", "interview", "offer", "hired", "archived"] as const
export type PipelineTab = (typeof PIPELINE_TABS)[number]

export const PIPELINE_LABEL: Record<PipelineTab, string> = {
  chatting: "Chat",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  archived: "Archive",
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

export function jobTypeLabel(raw: string | null | undefined) {
  return (raw || "role").replace(/_/g, " ")
}

export function salaryLine(opts: {
  min?: number | null
  max?: number | null
  currency?: string | null
  note?: string | null
}) {
  const cur = opts.currency || "PKR"
  if (opts.min && opts.max) return `${cur} ${opts.min.toLocaleString()}–${opts.max.toLocaleString()}`
  if (opts.min) return `${cur} ${opts.min.toLocaleString()}+`
  if (opts.max) return `Up to ${cur} ${opts.max.toLocaleString()}`
  return opts.note?.trim() || null
}
