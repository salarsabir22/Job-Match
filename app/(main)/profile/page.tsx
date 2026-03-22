/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase joined rows; narrow types incrementally */
import React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  GraduationCap, Calendar, Github, Linkedin, FileText, Edit, Building2,
  CheckCircle, Clock, Heart, Layers, Zap, AlertCircle, Globe,
  BarChart2, TrendingUp, BookOpen, Tag, Mail, Users
} from "lucide-react"
import { getInitials } from "@/lib/utils"
import Link from "next/link"
import { ProfileVideoBlock } from "@/components/profile/ProfileVideoBlock"

type QuickLink = { label: string; href: string; icon: React.ElementType }

function QuickActions({ isStudent }: { isStudent: boolean }) {
  const studentLinks: QuickLink[] = [
    { label: "Browse Jobs", href: "/discover", icon: Zap },
    { label: "My Matches", href: "/matches", icon: Heart },
    { label: "Saved Jobs", href: "/saved", icon: BookOpen },
    { label: "Community", href: "/community", icon: Globe },
  ]
  const recruiterLinks: QuickLink[] = [
    { label: "Post a Job", href: "/jobs/new", icon: Zap },
    { label: "My Jobs", href: "/jobs", icon: Layers },
    { label: "Candidates", href: "/discover", icon: Users },
    { label: "Matches", href: "/matches", icon: Heart },
  ]
  const links = isStudent ? studentLinks : recruiterLinks
  return (
    <div className="rounded-2xl bg-white border border-black/10 p-5">
      <p className="font-data text-[10px] tracking-widest uppercase text-neutral-700 mb-3">Quick Actions</p>
      <div className="grid grid-cols-2 gap-2">
        {links.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-black/10 text-neutral-700 hover:border-[#FAFAFA]/30 hover:text-black transition-all duration-200">
            <Icon className="h-3.5 w-3.5 text-neutral-900" />
            <span className="font-body text-xs">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function computeStudentCompleteness(profile: any, sp: any): { score: number; missing: string[] } {
  const checks = [
    { label: "Bio / About", done: !!profile?.bio?.trim() },
    { label: "Profile photo", done: !!profile?.avatar_url },
    { label: "Profile video", done: !!profile?.profile_video_url },
    { label: "University", done: !!sp?.university },
    { label: "Degree", done: !!sp?.degree },
    { label: "Graduation year", done: !!sp?.graduation_year },
    { label: "Skills (min 3)", done: (sp?.skills?.length || 0) >= 3 },
    { label: "LinkedIn URL", done: !!sp?.linkedin_url },
    { label: "Resume upload", done: !!sp?.resume_url },
  ]
  const done = checks.filter(c => c.done).length
  return {
    score: Math.round((done / checks.length) * 100),
    missing: checks.filter(c => !c.done).map(c => c.label),
  }
}

function computeRecruiterCompleteness(profile: any, rp: any): { score: number; missing: string[] } {
  const checks = [
    { label: "Company description", done: !!rp?.description?.trim() },
    { label: "Company logo", done: !!rp?.logo_url },
    { label: "Profile video", done: !!profile?.profile_video_url },
    { label: "Website URL", done: !!rp?.website_url },
    { label: "Hiring focus", done: !!rp?.hiring_focus?.trim() },
    { label: "Bio / About", done: !!profile?.bio?.trim() },
    { label: "Posted first job", done: false }, // updated below via activityCount
  ]
  const done = checks.filter(c => c.done).length
  return {
    score: Math.round((done / checks.length) * 100),
    missing: checks.filter(c => !c.done).map(c => c.label),
  }
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  const isStudent = profile?.role === "student"
  const isRecruiter = profile?.role === "recruiter"

  const { data: studentProfile } = isStudent
    ? await supabase.from("student_profiles").select("*").eq("id", user.id).maybeSingle()
    : { data: null }

  const { data: recruiterProfile } = isRecruiter
    ? await supabase.from("recruiter_profiles").select("*").eq("id", user.id).maybeSingle()
    : { data: null }

  const { count: matchCount } = await supabase
    .from("matches").select("*", { count: "exact", head: true })
    .or(`student_id.eq.${user.id},recruiter_id.eq.${user.id}`)

  const { count: activityCount } = isStudent
    ? await supabase.from("job_swipes").select("*", { count: "exact", head: true }).eq("student_id", user.id).eq("direction", "right")
    : await supabase.from("jobs").select("*", { count: "exact", head: true }).eq("recruiter_id", user.id)

  const { count: savedCount } = isStudent
    ? await supabase.from("job_swipes").select("*", { count: "exact", head: true }).eq("student_id", user.id).eq("direction", "saved")
    : { count: null }

  // Completeness
  const { score: completeness, missing } = isStudent
    ? computeStudentCompleteness(profile, studentProfile)
    : computeRecruiterCompleteness(profile, recruiterProfile)

  const completenessColor = completeness >= 80 ? "#171717" : completeness >= 50 ? "#404040" : "#737373"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div>
            <h1 className="font-heading text-2xl font-bold text-black sm:text-[1.75rem]">Profile</h1>
            <p className="font-data text-[10px] tracking-wider uppercase text-neutral-600 mt-0.5">
              {profile?.full_name || user.email}
            </p>
          </div>
        </div>
        <Link
          href="/onboarding"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/12 text-neutral-700 text-sm font-body hover:border-[#FAFAFA]/40 hover:text-black transition-all duration-200"
        >
          <Edit className="h-4 w-4" />Edit Profile
        </Link>
      </div>

      {/* Profile completeness banner */}
      {completeness < 100 && (
        <div className="rounded-xl bg-white border border-black/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" style={{ color: completenessColor }} />
              <p className="font-data text-[11px] tracking-wider uppercase text-neutral-800">Profile Completeness</p>
            </div>
            <p className="font-heading font-bold text-lg" style={{ color: completenessColor }}>{completeness}%</p>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${completeness}%`, background: completenessColor }}
            />
          </div>
          {missing.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {missing.slice(0, 4).map(item => (
                <div key={item} className="flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3 text-neutral-700" />
                  <span className="font-data text-[9px] tracking-wider text-neutral-800">{item}</span>
                </div>
              ))}
              {missing.length > 4 && (
                <span className="font-data text-[9px] text-neutral-700">+{missing.length - 4} more</span>
              )}
            </div>
          )}
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-1.5 font-body text-xs text-neutral-900 hover:text-neutral-600 transition-colors"
          >
            Complete your profile →
          </Link>
        </div>
      )}

      {completeness === 100 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-500/8 border border-neutral-500/20">
          <CheckCircle className="h-4 w-4 text-neutral-400 shrink-0" />
          <p className="font-body text-sm text-neutral-400">Your profile is 100% complete — you&apos;re getting maximum visibility!</p>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

        {/* Left column */}
        <div className="space-y-4">
          {/* Avatar card */}
          <div className="rounded-2xl bg-white border border-black/10 p-6 flex flex-col items-center gap-4 shadow-[0_0_50px_-10px_rgba(255,255,255,0.08)]">
            {isStudent ? (
              <Avatar className="h-28 w-28 border-2 border-black/15 shadow-sm">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-white text-neutral-900 text-3xl font-bold">
                  {getInitials(profile?.full_name || "?")}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-28 w-28 rounded-3xl overflow-hidden border-2 border-[#D4D4D4]/40 shadow-[0_0_25px_-5px_rgba(255,214,0,0.2)] bg-neutral-200 flex items-center justify-center">
                {(recruiterProfile as any)?.logo_url ? (
                  <img src={(recruiterProfile as any).logo_url} className="h-full w-full object-cover" alt="company logo" />
                ) : (
                  <Building2 className="h-14 w-14 text-black" />
                )}
              </div>
            )}

            <div className="text-center w-full">
              <h2 className="font-heading font-bold text-xl text-black">
                {isRecruiter ? ((recruiterProfile as any)?.company_name || profile?.full_name) : profile?.full_name}
              </h2>
              <p className="font-body text-sm text-neutral-700 mt-0.5 flex items-center justify-center gap-1">
                <Mail className="h-3 w-3" />{user.email}
              </p>
              {isStudent && (studentProfile as any)?.university && (
                <p className="font-body text-sm text-neutral-700 flex items-center justify-center gap-1 mt-1">
                  <GraduationCap className="h-3.5 w-3.5" />{(studentProfile as any).university}
                </p>
              )}
              {isRecruiter && (
                <div className="mt-2">
                  {(recruiterProfile as any)?.is_approved ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-500/15 border border-neutral-500/30 text-neutral-400 font-data text-[10px] tracking-wider uppercase">
                      <CheckCircle className="h-3 w-3" />Verified Recruiter
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#D4D4D4]/10 border border-[#D4D4D4]/25 text-[#D4D4D4] font-data text-[10px] tracking-wider uppercase">
                      <Clock className="h-3 w-3" />Pending Approval
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Activity stats */}
          <div className="rounded-xl bg-white border border-black/10 p-4">
            <p className="font-data text-[10px] tracking-widest uppercase text-neutral-700 mb-3">Activity</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-neutral-700" />
                  <p className="font-body text-sm text-neutral-700">{isStudent ? "Jobs applied" : "Jobs posted"}</p>
                </div>
                <p className="font-heading font-bold text-sm text-black">{activityCount || 0}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-3.5 w-3.5 text-neutral-900" />
                  <p className="font-body text-sm text-neutral-700">Matches</p>
                </div>
                <p className="font-heading font-bold text-sm text-neutral-900">{matchCount || 0}</p>
              </div>
              {isStudent && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-[#D4D4D4]" />
                    <p className="font-body text-sm text-neutral-700">Saved jobs</p>
                  </div>
                  <p className="font-heading font-bold text-sm text-[#D4D4D4]">{savedCount || 0}</p>
                </div>
              )}
              {isStudent && activityCount && activityCount > 0 ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-[#D4D4D4]" />
                    <p className="font-body text-sm text-neutral-700">Match rate</p>
                  </div>
                  <p className="font-heading font-bold text-sm text-[#D4D4D4]">
                    {Math.round(((matchCount || 0) / activityCount) * 100)}%
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Links (student) */}
          {isStudent && (
            <div className="rounded-xl bg-white border border-black/10 p-4 space-y-2.5">
              <p className="font-data text-[10px] tracking-widest uppercase text-neutral-700">Links</p>
              {(studentProfile as any)?.linkedin_url && (
                <a href={(studentProfile as any).linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-neutral-900 hover:text-neutral-600 font-body transition-colors">
                  <Linkedin className="h-4 w-4" />LinkedIn Profile
                </a>
              )}
              {(studentProfile as any)?.github_url && (
                <a href={(studentProfile as any).github_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-neutral-700 hover:text-black font-body transition-colors">
                  <Github className="h-4 w-4" />GitHub
                </a>
              )}
              {(studentProfile as any)?.resume_url && (
                <a href={(studentProfile as any).resume_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-neutral-900 hover:text-neutral-600 font-body transition-colors">
                  <FileText className="h-4 w-4" />View Resume
                </a>
              )}
              {!(studentProfile as any)?.linkedin_url && !(studentProfile as any)?.github_url && !(studentProfile as any)?.resume_url && (
                <div className="space-y-1">
                  <p className="text-xs text-neutral-700/60 font-body italic">No links added yet.</p>
                  <Link href="/onboarding" className="text-xs text-neutral-900 font-body hover:underline">Add links →</Link>
                </div>
              )}
            </div>
          )}

          {/* Website (recruiter) */}
          {isRecruiter && (recruiterProfile as any)?.website_url && (
            <div className="rounded-xl bg-white border border-black/10 p-4">
              <p className="font-data text-[10px] tracking-widest uppercase text-neutral-700 mb-2">Company Website</p>
              <a href={(recruiterProfile as any).website_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-neutral-900 hover:text-neutral-600 font-body transition-colors truncate">
                <Globe className="h-4 w-4 shrink-0" />{(recruiterProfile as any).website_url}
              </a>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* About */}
          <div className="rounded-2xl bg-white border border-black/10 p-6">
            <h3 className="font-data text-[11px] tracking-widest uppercase text-neutral-700 mb-3">About</h3>
            {profile?.bio ? (
              <p className="font-body text-sm text-neutral-700 leading-relaxed">{profile.bio}</p>
            ) : (
              <div className="space-y-2">
                <p className="font-body text-sm text-neutral-700/50 italic">No bio added yet.</p>
                <Link href="/onboarding" className="inline-flex items-center gap-1 text-xs text-neutral-900 font-body hover:text-neutral-600 transition-colors">
                  <Edit className="h-3 w-3" />Add bio →
                </Link>
              </div>
            )}
          </div>

          {/* Profile video (upload or record) */}
          <ProfileVideoBlock
            userId={user.id}
            initialVideoUrl={(profile as any)?.profile_video_url ?? null}
          />

          {/* Student sections */}
          {isStudent && (
            <>
              <div className="rounded-2xl bg-white border border-black/10 p-6">
                <h3 className="font-data text-[11px] tracking-widest uppercase text-neutral-700 mb-3">Education</h3>
                {(studentProfile as any)?.degree || (studentProfile as any)?.university ? (
                  <div className="space-y-1.5">
                    {(studentProfile as any)?.university && (
                      <p className="font-heading font-semibold text-black">{(studentProfile as any).university}</p>
                    )}
                    {(studentProfile as any)?.degree && (
                      <p className="font-body text-sm text-neutral-700">{(studentProfile as any).degree}</p>
                    )}
                    {(studentProfile as any)?.graduation_year && (
                      <p className="font-body text-sm text-neutral-700 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />Class of {(studentProfile as any).graduation_year}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="font-body text-sm text-neutral-700/50 italic">No education info added.</p>
                    <Link href="/onboarding" className="inline-flex items-center gap-1 text-xs text-neutral-900 font-body hover:text-neutral-600 transition-colors">
                      <GraduationCap className="h-3 w-3" />Add education →
                    </Link>
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-white border border-black/10 p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-data text-[11px] tracking-widest uppercase text-neutral-700">Skills</h3>
                  {(studentProfile as any)?.skills?.length > 0 && (
                    <span className="font-data text-[10px] text-neutral-700">{(studentProfile as any).skills.length} skills</span>
                  )}
                </div>
                {(studentProfile as any)?.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {(studentProfile as any).skills.map((s: string) => (
                      <span key={s} className="px-3 py-1.5 rounded-full bg-[#FAFAFA]/15 border border-[#FAFAFA]/30 text-neutral-900 font-data text-[10px] tracking-wider">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="font-body text-sm text-neutral-700/50 italic">No skills added yet.</p>
                    <Link href="/onboarding" className="inline-flex items-center gap-1 text-xs text-neutral-900 font-body hover:text-neutral-600 transition-colors">
                      <Tag className="h-3 w-3" />Add skills →
                    </Link>
                  </div>
                )}
              </div>

              {(studentProfile as any)?.preferred_job_categories?.length > 0 && (
                <div className="rounded-2xl bg-white border border-black/10 p-6">
                  <h3 className="font-data text-[11px] tracking-widest uppercase text-neutral-700 mb-3">Job Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {(studentProfile as any).preferred_job_categories.map((c: string) => (
                      <span key={c} className="px-3 py-1.5 rounded-full bg-white/5 border border-black/10 text-neutral-700 font-data text-[10px] tracking-wider">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Recruiter sections */}
          {isRecruiter && (
            <div className="rounded-2xl bg-white border border-black/10 p-6 space-y-4">
              <h3 className="font-data text-[11px] tracking-widest uppercase text-neutral-700">Company Info</h3>
              {(recruiterProfile as any)?.description ? (
                <p className="font-body text-sm text-neutral-700 leading-relaxed">{(recruiterProfile as any).description}</p>
              ) : (
                <p className="font-body text-sm text-neutral-700/50 italic">No company description added.</p>
              )}
              {(recruiterProfile as any)?.hiring_focus && (
                <div>
                  <p className="font-data text-[10px] tracking-wider uppercase text-neutral-700 mb-1">Hiring Focus</p>
                  <p className="font-body text-sm text-black">{(recruiterProfile as any).hiring_focus}</p>
                </div>
              )}
              {!(recruiterProfile as any)?.description && !(recruiterProfile as any)?.hiring_focus && (
                <Link href="/onboarding" className="inline-flex items-center gap-1 text-xs text-neutral-900 font-body hover:text-neutral-600 transition-colors">
                  <Building2 className="h-3 w-3" />Complete company details →
                </Link>
              )}
            </div>
          )}

          {/* Quick links */}
          <QuickActions isStudent={isStudent} />
        </div>
      </div>
    </div>
  )
}
