"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/lib/hooks/use-toast"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const SKILL_SUGGESTIONS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Python",
  "Node.js",
  "SQL",
  "Java",
  "AWS",
  "Docker",
  "Git",
  "Machine Learning",
  "Figma",
]

const inputClass =
  "w-full h-11 px-4 rounded-xl bg-white border border-neutral-200 text-neutral-950 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-300 transition-shadow"
const textareaClass =
  "w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-950 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950/10 focus:border-neutral-300 resize-none transition-shadow"
const labelClass = "block font-body text-sm font-medium text-neutral-700 mb-1.5"

export default function NewJobPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [jobType, setJobType] = useState("")
  const [location, setLocation] = useState("")
  const [isRemote, setIsRemote] = useState(false)
  const [requiredSkills, setRequiredSkills] = useState<string[]>([])
  const [niceToHaveSkills, setNiceToHaveSkills] = useState<string[]>([])
  const [reqSkillInput, setReqSkillInput] = useState("")
  const [nthSkillInput, setNthSkillInput] = useState("")

  const addSkill = (skill: string, list: string[], setList: (v: string[]) => void, clear: () => void) => {
    const s = skill.trim()
    if (s && !list.includes(s)) setList([...list, s])
    clear()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !jobType) {
      toast({ variant: "destructive", title: "Missing fields", description: "Title and job type are required." })
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from("jobs").insert({
      recruiter_id: user!.id,
      title,
      description: description || null,
      job_type: jobType,
      location: location || null,
      is_remote: isRemote,
      required_skills: requiredSkills,
      nice_to_have_skills: niceToHaveSkills,
    })
    if (error) {
      toast({ variant: "destructive", title: "Failed to post job", description: error.message })
      setLoading(false)
      return
    }
    toast({ title: "Job posted", description: "Your listing is live in your dashboard." })
    router.push("/jobs")
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/jobs"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition hover:bg-neutral-50"
          aria-label="Back to jobs"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        </Link>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-950 min-w-0 sm:text-[1.75rem]">Post a job</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-6">
        <div>
          <label className={labelClass} htmlFor="job-title">
            Title <span className="text-neutral-400 font-normal">(required)</span>
          </label>
          <input
            id="job-title"
            className={inputClass}
            placeholder="e.g. Frontend engineer intern"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="job-type">
            Type <span className="text-neutral-400 font-normal">(required)</span>
          </label>
          <select id="job-type" className={inputClass} value={jobType} onChange={(e) => setJobType(e.target.value)} required>
            <option value="">Select type</option>
            <option value="internship">Internship</option>
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="job-desc">
            Description
          </label>
          <textarea
            id="job-desc"
            className={textareaClass}
            placeholder="What will they do, learn, and ship?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 min-w-0">
            <label className={labelClass} htmlFor="job-location">
              Location
            </label>
            <input
              id="job-location"
              className={inputClass}
              placeholder="e.g. San Francisco, CA"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isRemote}
            />
          </div>
          <button
            type="button"
            onClick={() => setIsRemote(!isRemote)}
            className={cn(
              "h-11 shrink-0 rounded-xl border px-4 font-body text-sm font-medium transition-colors sm:min-w-[7rem]",
              isRemote
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
            )}
          >
            Remote
          </button>
        </div>

        <div className="space-y-3">
          <label className={labelClass}>Required skills</label>
          <div className="flex gap-2">
            <input
              className={inputClass}
              placeholder="Add a skill"
              value={reqSkillInput}
              onChange={(e) => setReqSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addSkill(reqSkillInput, requiredSkills, setRequiredSkills, () => setReqSkillInput(""))
                }
              }}
            />
            <button
              type="button"
              onClick={() => addSkill(reqSkillInput, requiredSkills, setRequiredSkills, () => setReqSkillInput(""))}
              className="h-11 shrink-0 rounded-xl border border-neutral-200 bg-white px-4 font-body text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {SKILL_SUGGESTIONS.filter((s) => !requiredSkills.includes(s))
              .slice(0, 6)
              .map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSkill(s, requiredSkills, setRequiredSkills, () => {})}
                  className="rounded-full border border-dashed border-neutral-200 px-2.5 py-1 font-body text-xs text-neutral-600 hover:border-neutral-300 hover:text-neutral-950"
                >
                  + {s}
                </button>
              ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {requiredSkills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 font-body text-xs text-neutral-800"
              >
                {s}
                <button
                  type="button"
                  className="text-neutral-400 hover:text-neutral-950"
                  aria-label={`Remove ${s}`}
                  onClick={() => setRequiredSkills(requiredSkills.filter((x) => x !== s))}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className={labelClass}>Nice-to-have skills</label>
          <div className="flex gap-2">
            <input
              className={inputClass}
              placeholder="Add a skill"
              value={nthSkillInput}
              onChange={(e) => setNthSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addSkill(nthSkillInput, niceToHaveSkills, setNiceToHaveSkills, () => setNthSkillInput(""))
                }
              }}
            />
            <button
              type="button"
              onClick={() => addSkill(nthSkillInput, niceToHaveSkills, setNiceToHaveSkills, () => setNthSkillInput(""))}
              className="h-11 shrink-0 rounded-xl border border-neutral-200 bg-white px-4 font-body text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {niceToHaveSkills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-100 bg-white px-2.5 py-1 font-body text-xs text-neutral-600"
              >
                {s}
                <button
                  type="button"
                  className="text-neutral-400 hover:text-neutral-950"
                  aria-label={`Remove ${s}`}
                  onClick={() => setNiceToHaveSkills(niceToHaveSkills.filter((x) => x !== s))}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-neutral-950 font-body text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Publish listing"}
        </button>
      </form>
    </div>
  )
}
