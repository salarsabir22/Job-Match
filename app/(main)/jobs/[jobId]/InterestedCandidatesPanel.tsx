"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials, formatDate } from "@/lib/utils"
import { useToast } from "@/lib/hooks/use-toast"

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
      title: direction === "right" ? "Shortlisted" : "Passed",
      description:
        direction === "right"
          ? "Your interest in this candidate has been saved."
          : "Your decision has been saved.",
    })
    setBusyId(null)
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
      <div>
        <h2 className="font-heading text-lg font-semibold text-neutral-950">Applicants</h2>
        <p className="font-body text-sm text-neutral-500 mt-1">Students who applied to this listing.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-6">
          <div
            className="h-6 w-6 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin shrink-0"
            aria-hidden
          />
          <p className="font-body text-sm text-neutral-600">Loading…</p>
        </div>
      ) : items.length === 0 ? (
        <p className="font-body text-sm text-neutral-600 py-2">No applications yet.</p>
      ) : (
        <ul className="space-y-3 list-none p-0 m-0">
          {items.map((item) => {
            const schoolLine = [item.university, item.degree, item.graduation_year].filter(Boolean).join(" · ")
            const links = [
              item.resume_url && { href: item.resume_url, label: "Resume" },
              item.linkedin_url && { href: item.linkedin_url, label: "LinkedIn" },
              item.github_url && { href: item.github_url, label: "GitHub" },
              item.portfolio_url && { href: item.portfolio_url, label: "Portfolio" },
            ].filter(Boolean) as { href: string; label: string }[]

            return (
              <li key={item.id} className="rounded-2xl border border-neutral-200 p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-11 w-11 shrink-0 ring-1 ring-neutral-200">
                    <AvatarImage src={item.avatar_url || undefined} />
                    <AvatarFallback className="bg-neutral-100 text-neutral-800 text-xs font-semibold">
                      {getInitials(item.full_name || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-heading text-sm font-semibold text-neutral-950 truncate">
                          {item.full_name || "Candidate"}
                        </p>
                        {schoolLine && (
                          <p className="font-body text-[11px] text-neutral-500 mt-0.5 truncate">{schoolLine}</p>
                        )}
                      </div>
                      <time className="font-body text-[11px] text-neutral-400 shrink-0 tabular-nums">
                        {formatDate(item.applied_at)}
                      </time>
                    </div>
                    {item.bio && (
                      <p className="font-body text-xs text-neutral-600 mt-2 line-clamp-2 leading-relaxed">{item.bio}</p>
                    )}

                    {item.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {item.skills.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-body text-[11px] text-neutral-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {links.length > 0 && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                        {links.map(({ href, label }) => (
                          <a
                            key={label}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-body text-xs font-medium text-neutral-950 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-950"
                          >
                            {label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-100">
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => void setDecision(item.id, "right")}
                    className="flex-1 rounded-xl bg-neutral-950 py-2.5 font-body text-xs font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
                  >
                    Shortlist
                  </button>
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => void setDecision(item.id, "left")}
                    className="flex-1 rounded-xl border border-neutral-200 py-2.5 font-body text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
                  >
                    Pass
                  </button>
                </div>

                {item.decision && (
                  <p className="font-body text-[11px] text-neutral-500 mt-2">
                    {item.decision === "right" ? "Shortlisted" : "Passed"}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
