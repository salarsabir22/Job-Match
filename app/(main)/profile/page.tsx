import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GraduationCap, Calendar, Github, Linkedin, FileText, Edit, Building2, CheckCircle, Clock, Link2, Heart, Layers } from "lucide-react"
import { getInitials } from "@/lib/utils"
import Link from "next/link"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  const isStudent = profile?.role === "student"
  const isRecruiter = profile?.role === "recruiter"

  const { data: studentProfile } = isStudent
    ? await supabase.from("student_profiles").select("*").eq("id", user.id).single()
    : { data: null }

  const { data: recruiterProfile } = isRecruiter
    ? await supabase.from("recruiter_profiles").select("*").eq("id", user.id).single()
    : { data: null }

  const { count: matchCount } = await supabase.from("matches").select("*", { count: "exact", head: true }).or(`student_id.eq.${user.id},recruiter_id.eq.${user.id}`)
  const { count: activityCount } = isStudent
    ? await supabase.from("job_swipes").select("*", { count: "exact", head: true }).eq("student_id", user.id).eq("direction", "right")
    : await supabase.from("jobs").select("*", { count: "exact", head: true }).eq("recruiter_id", user.id)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-white">Profile</h1>
          <p className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8] mt-0.5">Your account details</p>
        </div>
        <Link href="/onboarding"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/12 text-[#94A3B8] text-sm font-body hover:border-white/25 hover:text-white transition-all duration-200">
          <Edit className="h-4 w-4" /> Edit Profile
        </Link>
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

        {/* Left column — avatar, name, stats */}
        <div className="space-y-4">
          {/* Avatar card */}
          <div className="rounded-2xl bg-[#0F1115] border border-white/8 p-6 flex flex-col items-center gap-4 shadow-[0_0_50px_-10px_rgba(247,147,26,0.08)]">
            {isStudent ? (
              <Avatar className="h-28 w-28 border-2 border-[#F7931A]/40 shadow-[0_0_25px_-5px_rgba(247,147,26,0.3)]">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-[#0A0B0E] text-[#F7931A] text-3xl font-bold">
                  {getInitials(profile?.full_name || "?")}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-28 w-28 rounded-3xl overflow-hidden border-2 border-[#FFD600]/40 shadow-[0_0_25px_-5px_rgba(255,214,0,0.2)] bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center">
                {(recruiterProfile as any)?.logo_url ? (
                  <img src={(recruiterProfile as any).logo_url} className="h-full w-full object-cover" alt="" />
                ) : (
                  <Building2 className="h-14 w-14 text-white" />
                )}
              </div>
            )}
            <div className="text-center">
              <h2 className="font-heading font-bold text-xl text-white">
                {isRecruiter ? ((recruiterProfile as any)?.company_name || profile?.full_name) : profile?.full_name}
              </h2>
              <p className="font-body text-sm text-[#94A3B8] mt-0.5">{user.email}</p>
              {isStudent && (studentProfile as any)?.university && (
                <p className="font-body text-sm text-[#94A3B8] flex items-center justify-center gap-1 mt-1">
                  <GraduationCap className="h-3.5 w-3.5" />{(studentProfile as any).university}
                </p>
              )}
              {isRecruiter && (
                <div className="mt-2">
                  {(recruiterProfile as any)?.is_approved ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 font-data text-[10px] tracking-wider uppercase">
                      <CheckCircle className="h-3 w-3" />Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFD600]/10 border border-[#FFD600]/25 text-[#FFD600] font-data text-[10px] tracking-wider uppercase">
                      <Clock className="h-3 w-3" />Pending Approval
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#0F1115] border border-white/8 p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Layers className="h-4 w-4 text-[#94A3B8]" />
              </div>
              <p className="font-heading font-bold text-2xl gradient-text">{activityCount || 0}</p>
              <p className="font-data text-[10px] tracking-wider uppercase text-[#94A3B8] mt-1">{isStudent ? "Applied" : "Jobs"}</p>
            </div>
            <div className="rounded-xl bg-[#0F1115] border border-[#F7931A]/20 p-4 text-center shadow-[0_0_15px_-5px_rgba(247,147,26,0.1)]">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Heart className="h-4 w-4 text-[#F7931A]" />
              </div>
              <p className="font-heading font-bold text-2xl text-[#F7931A]">{matchCount || 0}</p>
              <p className="font-data text-[10px] tracking-wider uppercase text-[#94A3B8] mt-1">Matches</p>
            </div>
          </div>

          {/* Links */}
          {isStudent && (
            <div className="rounded-xl bg-[#0F1115] border border-white/8 p-4 space-y-2.5">
              <p className="font-data text-[10px] tracking-widest uppercase text-[#94A3B8]">Links</p>
              {(studentProfile as any)?.linkedin_url && (
                <a href={(studentProfile as any).linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#F7931A] hover:text-[#FFD600] font-body transition-colors">
                  <Linkedin className="h-4 w-4" />LinkedIn
                </a>
              )}
              {(studentProfile as any)?.github_url && (
                <a href={(studentProfile as any).github_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white font-body transition-colors">
                  <Github className="h-4 w-4" />GitHub
                </a>
              )}
              {(studentProfile as any)?.resume_url && (
                <a href={(studentProfile as any).resume_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#F7931A] hover:text-[#FFD600] font-body transition-colors">
                  <FileText className="h-4 w-4" />View Resume
                </a>
              )}
              {!(studentProfile as any)?.linkedin_url && !(studentProfile as any)?.github_url && !(studentProfile as any)?.resume_url && (
                <p className="text-xs text-[#94A3B8] font-body">No links added yet.</p>
              )}
            </div>
          )}

          {isRecruiter && (recruiterProfile as any)?.website_url && (
            <div className="rounded-xl bg-[#0F1115] border border-white/8 p-4">
              <p className="font-data text-[10px] tracking-widest uppercase text-[#94A3B8] mb-2">Website</p>
              <a href={(recruiterProfile as any).website_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[#F7931A] hover:text-[#FFD600] font-body transition-colors truncate">
                <Link2 className="h-4 w-4 shrink-0" />{(recruiterProfile as any).website_url}
              </a>
            </div>
          )}
        </div>

        {/* Right column — details */}
        <div className="space-y-4">
          {/* Bio */}
          <div className="rounded-2xl bg-[#0F1115] border border-white/8 p-6">
            <h3 className="font-data text-[11px] tracking-widest uppercase text-[#94A3B8] mb-3">About</h3>
            {profile?.bio ? (
              <p className="font-body text-sm text-[#94A3B8] leading-relaxed">{profile.bio}</p>
            ) : (
              <p className="font-body text-sm text-[#94A3B8]/50 italic">No bio added. <Link href="/onboarding" className="text-[#F7931A] not-italic hover:underline">Add one →</Link></p>
            )}
          </div>

          {/* Student: Education + Skills */}
          {isStudent && (
            <>
              <div className="rounded-2xl bg-[#0F1115] border border-white/8 p-6">
                <h3 className="font-data text-[11px] tracking-widest uppercase text-[#94A3B8] mb-3">Education</h3>
                {(studentProfile as any)?.degree || (studentProfile as any)?.graduation_year ? (
                  <div className="space-y-1.5">
                    {(studentProfile as any)?.university && <p className="font-heading font-semibold text-white">{(studentProfile as any).university}</p>}
                    {(studentProfile as any)?.degree && <p className="font-body text-sm text-[#94A3B8]">{(studentProfile as any).degree}</p>}
                    {(studentProfile as any)?.graduation_year && (
                      <p className="font-body text-sm text-[#94A3B8] flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />Class of {(studentProfile as any).graduation_year}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="font-body text-sm text-[#94A3B8]/50 italic">No education info.</p>
                )}
              </div>

              <div className="rounded-2xl bg-[#0F1115] border border-white/8 p-6">
                <h3 className="font-data text-[11px] tracking-widest uppercase text-[#94A3B8] mb-3">Skills</h3>
                {(studentProfile as any)?.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {(studentProfile as any).skills.map((s: string) => (
                      <span key={s} className="px-3 py-1.5 rounded-full bg-[#F7931A]/15 border border-[#F7931A]/30 text-[#F7931A] font-data text-[10px] tracking-wider">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="font-body text-sm text-[#94A3B8]/50 italic">No skills added.</p>
                )}
              </div>

              {(studentProfile as any)?.preferred_job_categories?.length > 0 && (
                <div className="rounded-2xl bg-[#0F1115] border border-white/8 p-6">
                  <h3 className="font-data text-[11px] tracking-widest uppercase text-[#94A3B8] mb-3">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {(studentProfile as any).preferred_job_categories.map((c: string) => (
                      <span key={c} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#94A3B8] font-data text-[10px] tracking-wider">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Recruiter: Company info */}
          {isRecruiter && (
            <div className="rounded-2xl bg-[#0F1115] border border-white/8 p-6 space-y-4">
              <h3 className="font-data text-[11px] tracking-widest uppercase text-[#94A3B8]">Company Info</h3>
              {(recruiterProfile as any)?.description && (
                <p className="font-body text-sm text-[#94A3B8] leading-relaxed">{(recruiterProfile as any).description}</p>
              )}
              {(recruiterProfile as any)?.hiring_focus && (
                <div>
                  <p className="font-data text-[10px] tracking-wider uppercase text-[#94A3B8] mb-1">Hiring Focus</p>
                  <p className="font-body text-sm text-white">{(recruiterProfile as any).hiring_focus}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
