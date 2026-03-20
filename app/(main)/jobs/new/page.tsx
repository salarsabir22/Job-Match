"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/lib/hooks/use-toast"
import { ArrowLeft, Plus, X, Loader2, Wifi } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const SKILL_SUGGESTIONS = ["JavaScript", "TypeScript", "React", "Python", "Node.js", "SQL", "Java", "AWS", "Docker", "Git", "Machine Learning", "Figma"]

const inputClass = "w-full h-11 px-4 rounded-xl bg-[#030304] border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#FAFAFA]/60 focus:shadow-[0_0_15px_-5px_rgba(255,255,255,0.3)] transition-all duration-200"
const textareaClass = "w-full px-4 py-3 rounded-xl bg-[#030304] border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#FAFAFA]/60 focus:shadow-[0_0_15px_-5px_rgba(255,255,255,0.3)] transition-all duration-200 resize-none"
const labelClass = "block font-data text-[11px] tracking-wider uppercase text-[#94A3B8] mb-1.5"

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
    const { error } = await supabase.from("jobs").insert({ recruiter_id: user!.id, title, description: description || null, job_type: jobType, location: location || null, is_remote: isRemote, required_skills: requiredSkills, nice_to_have_skills: niceToHaveSkills })
    if (error) {
      toast({ variant: "destructive", title: "Failed to post job", description: error.message })
      setLoading(false)
      return
    }
    toast({ title: "Job posted!", description: "Students can now find and swipe on your job." })
    router.push("/jobs")
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/jobs"
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
          <ArrowLeft className="h-4 w-4 text-white" />
        </Link>
        <h1 className="font-heading font-bold text-3xl text-white">Post a Job</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 pb-4">
        <div>
          <label className={labelClass}>Job Title <span className="text-neutral-500">*</span></label>
          <input className={inputClass} placeholder="e.g. Frontend Engineer Intern" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div>
          <label className={labelClass}>Job Type <span className="text-neutral-500">*</span></label>
          <select className={inputClass} value={jobType} onChange={(e) => setJobType(e.target.value)} required>
            <option value="" className="bg-[#030304]">Select type</option>
            <option value="internship" className="bg-[#030304]">Internship</option>
            <option value="full_time" className="bg-[#030304]">Full-time</option>
            <option value="part_time" className="bg-[#030304]">Part-time</option>
            <option value="contract" className="bg-[#030304]">Contract</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea className={textareaClass} placeholder="Describe the role..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </div>

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className={labelClass}>Location</label>
            <input className={inputClass} placeholder="e.g. San Francisco, CA" value={location} onChange={(e) => setLocation(e.target.value)} disabled={isRemote} />
          </div>
          <button type="button" onClick={() => setIsRemote(!isRemote)}
            className={cn("flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 font-data text-[10px] tracking-wider uppercase transition-all duration-200",
              isRemote ? "border-[#FAFAFA] bg-[#FAFAFA]/15 text-[#FAFAFA]" : "border-white/10 text-[#94A3B8] hover:border-white/20")}>
            <Wifi className="h-4 w-4" />Remote
          </button>
        </div>

        {/* Required skills */}
        <div className="space-y-2">
          <label className={labelClass}>Required Skills</label>
          <div className="flex gap-2">
            <input className={inputClass} placeholder="Add skill..." value={reqSkillInput} onChange={(e) => setReqSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill(reqSkillInput, requiredSkills, setRequiredSkills, () => setReqSkillInput("")))} />
            <button type="button" onClick={() => addSkill(reqSkillInput, requiredSkills, setRequiredSkills, () => setReqSkillInput(""))}
              className="h-11 w-11 rounded-xl bg-[#FAFAFA]/20 border border-[#FAFAFA]/40 text-[#FAFAFA] hover:bg-[#FAFAFA]/30 transition-colors flex-shrink-0 flex items-center justify-center">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {SKILL_SUGGESTIONS.filter(s => !requiredSkills.includes(s)).slice(0, 5).map(s => (
              <button key={s} type="button" onClick={() => addSkill(s, requiredSkills, setRequiredSkills, () => {})}
                className="font-data text-[10px] tracking-wider px-2.5 py-1 rounded-full border border-dashed border-white/15 text-[#94A3B8] hover:border-[#FAFAFA]/50 hover:text-[#FAFAFA] transition-colors">
                + {s}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {requiredSkills.map(s => (
              <span key={s} className="flex items-center gap-1 font-data text-[10px] tracking-wider px-2.5 py-1 rounded-full bg-[#FAFAFA]/15 border border-[#FAFAFA]/30 text-[#FAFAFA]">
                {s}<button type="button" onClick={() => setRequiredSkills(requiredSkills.filter(x => x !== s))}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        </div>

        {/* Nice-to-have skills */}
        <div className="space-y-2">
          <label className={labelClass}>Nice-to-Have Skills</label>
          <div className="flex gap-2">
            <input className={inputClass} placeholder="Add skill..." value={nthSkillInput} onChange={(e) => setNthSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill(nthSkillInput, niceToHaveSkills, setNiceToHaveSkills, () => setNthSkillInput("")))} />
            <button type="button" onClick={() => addSkill(nthSkillInput, niceToHaveSkills, setNiceToHaveSkills, () => setNthSkillInput(""))}
              className="h-11 w-11 rounded-xl bg-white/5 border border-white/15 text-[#94A3B8] hover:bg-white/10 transition-colors flex-shrink-0 flex items-center justify-center">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {niceToHaveSkills.map(s => (
              <span key={s} className="flex items-center gap-1 font-data text-[10px] tracking-wider px-2.5 py-1 rounded-full border border-white/12 text-[#94A3B8]">
                {s}<button type="button" onClick={() => setNiceToHaveSkills(niceToHaveSkills.filter(x => x !== s))}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-[#525252] to-[#FAFAFA] text-white font-body font-semibold shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.7)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post Job"}
        </button>
      </form>
    </div>
  )
}
