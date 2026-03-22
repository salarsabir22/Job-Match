"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/lib/hooks/use-toast"
import { ArrowLeft, Loader2, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

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
    const {
      data: { user },
    } = await supabase.auth.getUser()
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
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-full" asChild>
          <Link href="/jobs" aria-label="Back to jobs">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </Button>
        <div className="min-w-0">
          <p className="font-data text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">New listing</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">Post a job</h1>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Role details</CardTitle>
          <CardDescription>Students see this in Discover once your account is approved.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="job-title">
                Title <span className="font-normal text-muted-foreground">(required)</span>
              </Label>
              <Input
                id="job-title"
                className="h-11 rounded-xl"
                placeholder="e.g. Frontend engineer intern"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-type">
                Type <span className="font-normal text-muted-foreground">(required)</span>
              </Label>
              <Select value={jobType || undefined} onValueChange={setJobType}>
                <SelectTrigger id="job-type" className="h-11 rounded-xl">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="full_time">Full-time</SelectItem>
                  <SelectItem value="part_time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-desc">Description</Label>
              <Textarea
                id="job-desc"
                className="min-h-[120px] rounded-xl"
                placeholder="What will they do, learn, and ship?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="job-location">Location</Label>
                <Input
                  id="job-location"
                  className="h-11 rounded-xl"
                  placeholder="e.g. San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isRemote}
                />
              </div>
              <Button
                type="button"
                variant={isRemote ? "default" : "outline"}
                className="h-11 shrink-0 rounded-xl sm:min-w-[7rem]"
                onClick={() => setIsRemote(!isRemote)}
              >
                Remote
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Required skills</Label>
              <div className="flex gap-2">
                <Input
                  className="h-11 rounded-xl"
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
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 shrink-0 rounded-xl"
                  onClick={() => addSkill(reqSkillInput, requiredSkills, setRequiredSkills, () => setReqSkillInput(""))}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {SKILL_SUGGESTIONS.filter((s) => !requiredSkills.includes(s))
                  .slice(0, 6)
                  .map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSkill(s, requiredSkills, setRequiredSkills, () => {})}
                      className="rounded-full border border-dashed border-border px-2.5 py-1 font-body text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                    >
                      + {s}
                    </button>
                  ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {requiredSkills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1 font-body text-xs text-foreground"
                  >
                    {s}
                    <button
                      type="button"
                      className="text-muted-foreground transition hover:text-foreground"
                      aria-label={`Remove ${s}`}
                      onClick={() => setRequiredSkills(requiredSkills.filter((x) => x !== s))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Nice-to-have skills</Label>
              <div className="flex gap-2">
                <Input
                  className="h-11 rounded-xl"
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
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 shrink-0 rounded-xl"
                  onClick={() => addSkill(nthSkillInput, niceToHaveSkills, setNiceToHaveSkills, () => setNthSkillInput(""))}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {niceToHaveSkills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 font-body text-xs text-muted-foreground"
                  >
                    {s}
                    <button
                      type="button"
                      className="text-muted-foreground transition hover:text-foreground"
                      aria-label={`Remove ${s}`}
                      onClick={() => setNiceToHaveSkills(niceToHaveSkills.filter((x) => x !== s))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <Button type="submit" className="h-12 w-full rounded-xl" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Publish listing"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
