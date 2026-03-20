"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials, formatDate } from "@/lib/utils"
import { useToast } from "@/lib/hooks/use-toast"
import { Check, X, GraduationCap, FileText, Linkedin, Github, Link2 } from "lucide-react"

interface CandidateItem {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  applied_at: string
  university: string | null
  degree: string | null
  graduation_year: number | null
  skills: string[]
  resume_url: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  decision: "right" | "left" | null
}

interface ApplicationRow {
  student_id: string
  created_at: string
}

interface ProfileRow {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
}

interface StudentProfileRow {
  id: string
  university: string | null
  degree: string | null
  graduation_year: number | null
  skills: string[] | null
  resume_url: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
}

interface DecisionRow {
  student_id: string
  direction: "right" | "left"
}

export function InterestedCandidatesPanel({ recruiterId, jobId }: { recruiterId: string; jobId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [items, setItems] = useState<CandidateItem[]>([])

  useEffect(() => {
    const run = async () => {
      setLoading(true)

      const { data: applications } = await supabase
        .from("job_swipes")
        .select("student_id, created_at")
        .eq("job_id", jobId)
        .eq("direction", "right")
        .order("created_at", { ascending: false })

      const appRows = (applications || []) as ApplicationRow[]
      const studentIds = appRows.map((a) => a.student_id)
      if (studentIds.length === 0) {
        setItems([])
        setLoading(false)
        return
      }

      const [{ data: profiles }, { data: studentProfiles }, { data: decisions }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url, bio").in("id", studentIds),
        supabase
          .from("student_profiles")
          .select("id, university, degree, graduation_year, skills, resume_url, linkedin_url, github_url, portfolio_url")
          .in("id", studentIds),
        supabase
          .from("candidate_swipes")
          .select("student_id, direction")
          .eq("recruiter_id", recruiterId)
          .eq("job_id", jobId)
          .in("student_id", studentIds),
      ])

      const profileRows = (profiles || []) as ProfileRow[]
      const studentProfileRows = (studentProfiles || []) as StudentProfileRow[]
      const decisionRows = (decisions || []) as DecisionRow[]

      const profileMap = new Map(profileRows.map((p) => [p.id, p]))
      const spMap = new Map(studentProfileRows.map((sp) => [sp.id, sp]))
      const decisionMap = new Map(decisionRows.map((d) => [d.student_id, d.direction]))

      setItems(
        appRows.map((a) => {
          const p = profileMap.get(a.student_id)
          const sp = spMap.get(a.student_id)
          return {
            id: a.student_id,
            applied_at: a.created_at,
            full_name: p?.full_name ?? null,
            avatar_url: p?.avatar_url ?? null,
            bio: p?.bio ?? null,
            university: sp?.university ?? null,
            degree: sp?.degree ?? null,
            graduation_year: sp?.graduation_year ?? null,
            skills: sp?.skills ?? [],
            resume_url: sp?.resume_url ?? null,
            linkedin_url: sp?.linkedin_url ?? null,
            github_url: sp?.github_url ?? null,
            portfolio_url: sp?.portfolio_url ?? null,
            decision: decisionMap.get(a.student_id) ?? null,
          } as CandidateItem
        })
      )
      setLoading(false)
    }

    void run()
  }, [jobId, recruiterId, supabase])

  const setDecision = async (studentId: string, direction: "right" | "left") => {
    setBusyId(studentId)
    const { error } = await supabase
      .from("candidate_swipes")
      .upsert(
        { recruiter_id: recruiterId, student_id: studentId, job_id: jobId, direction },
        { onConflict: "recruiter_id,student_id,job_id" }
      )

    if (error) {
      toast({ title: "Could not update candidate", description: error.message })
      setBusyId(null)
      return
    }

    setItems((prev) => prev.map((i) => (i.id === studentId ? { ...i, decision: direction } : i)))
    toast({
      title: direction === "right" ? "Candidate shortlisted" : "Candidate rejected",
      description:
        direction === "right"
          ? "Candidate is notified to book a 30 min interview."
          : "Candidate is notified of the decision.",
    })
    setBusyId(null)
  }

  return (
    <div className="rounded-xl border border-black/10 bg-white p-4 space-y-4">
      <div>
        <h3 className="font-heading font-semibold text-lg text-black">Interested Candidates</h3>
        <p className="font-data text-[10px] tracking-wider uppercase text-neutral-700 mt-0.5">
          Candidates who swiped right on this job
        </p>
      </div>

      {loading ? (
        <p className="font-body text-sm text-neutral-700">Loading candidates...</p>
      ) : items.length === 0 ? (
        <p className="font-body text-sm text-neutral-700">No interested candidates yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-black/10 bg-white p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-11 w-11 border border-black/10">
                  <AvatarImage src={item.avatar_url || undefined} />
                  <AvatarFallback className="bg-white text-[#FAFAFA] text-xs font-bold">
                    {getInitials(item.full_name || "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-heading text-sm text-black truncate">{item.full_name || "Candidate"}</p>
                      {item.university && (
                        <p className="font-data text-[10px] text-neutral-700 mt-0.5 flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          {item.university}
                          {item.degree ? ` · ${item.degree}` : ""}
                          {item.graduation_year ? ` · ${item.graduation_year}` : ""}
                        </p>
                      )}
                    </div>
                    <p className="font-data text-[10px] text-neutral-700 shrink-0">{formatDate(item.applied_at)}</p>
                  </div>
                  {item.bio && <p className="font-body text-xs text-neutral-800 mt-2 line-clamp-2">{item.bio}</p>}

                  {item.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="font-data text-[9px] tracking-wider px-1.5 py-0.5 rounded-full bg-[#FAFAFA]/10 border border-[#FAFAFA]/20 text-[#FAFAFA]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    {item.resume_url && (
                      <a href={item.resume_url} target="_blank" rel="noreferrer" className="text-[#FAFAFA]">
                        <FileText className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {item.linkedin_url && (
                      <a href={item.linkedin_url} target="_blank" rel="noreferrer" className="text-[#A3A3A3]">
                        <Linkedin className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {item.github_url && (
                      <a href={item.github_url} target="_blank" rel="noreferrer" className="text-black">
                        <Github className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {item.portfolio_url && (
                      <a href={item.portfolio_url} target="_blank" rel="noreferrer" className="text-neutral-700">
                        <Link2 className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-black/10">
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => void setDecision(item.id, "right")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gradient-to-r from-[#525252] to-[#FAFAFA] text-black font-body text-xs font-semibold disabled:opacity-60"
                >
                  <Check className="h-3.5 w-3.5" /> Shortlist
                </button>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => void setDecision(item.id, "left")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-neutral-500/30 text-neutral-500 bg-red-500/8 font-body text-xs font-medium disabled:opacity-60"
                >
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
              </div>

              {item.decision && (
                <p className="font-data text-[9px] tracking-widest uppercase mt-2 text-neutral-700">
                  Status: {item.decision === "right" ? "Shortlisted" : "Rejected"}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
