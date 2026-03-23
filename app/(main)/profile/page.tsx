/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase joined rows; narrow types incrementally */
import React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  GraduationCap,
  Calendar,
  Github,
  Linkedin,
  FileText,
  Edit,
  Building2,
  CheckCircle,
  Clock,
  Heart,
  Layers,
  AlertCircle,
  Globe,
  BarChart2,
  TrendingUp,
  Bookmark,
  Tag,
  Mail,
  Users,
  Search,
  FilePlus,
} from "lucide-react"
import { getInitials } from "@/lib/utils"
import Link from "next/link"
import { ProfileVideoBlock } from "@/components/profile/ProfileVideoBlock"



import { DiscoverHeader } from "@/components/discover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

type QuickLink = { label: string; href: string; icon: React.ElementType }

function QuickActions({ isStudent }: { isStudent: boolean }) {
  const studentLinks: QuickLink[] = [
    { label: "Discover", href: "/discover", icon: Search },
    { label: "Matches", href: "/matches", icon: Heart },
    { label: "Saved", href: "/saved", icon: Bookmark },
    { label: "Community", href: "/community", icon: Users },
  ]
  const recruiterLinks: QuickLink[] = [
    { label: "New job", href: "/jobs/new", icon: FilePlus },
    { label: "Listings", href: "/jobs", icon: Layers },
    { label: "Candidates", href: "/discover", icon: Users },
    { label: "Matches", href: "/matches", icon: Heart },
  ]
  const links = isStudent ? studentLinks : recruiterLinks
  return (
    <Card className="shadow-sm">
      <CardContent className="flex flex-col gap-3 p-5 pt-5">
        <p className="font-data text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Navigation</p>
        <div className="grid grid-cols-2 gap-2">
          {links.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="font-body text-xs">{label}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
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

  const roleLabel = isStudent ? "Student" : isRecruiter ? "Recruiter" : "Account"
  const completenessBarClass =
    completeness >= 80 ? "bg-foreground" : completeness >= 50 ? "bg-muted-foreground" : "bg-muted-foreground/70"
  const completenessTextClass =
    completeness >= 80 ? "text-foreground" : completeness >= 50 ? "text-muted-foreground" : "text-muted-foreground"

  return (
    <div className="space-y-10">
      <DiscoverHeader
        eyebrow={roleLabel}
        title="Profile"
        description={
          <>
            {profile?.full_name || "Account"}
            <span className="text-muted-foreground"> · {user.email}</span>
          </>
        }
        action={
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/onboarding">
              <Edit className="h-4 w-4" />
              Edit
            </Link>
          </Button>
        }
      />

      {completeness < 100 && (
        <Card className="shadow-sm">
          <CardContent className="space-y-3 p-5 pt-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BarChart2 className={`h-4 w-4 shrink-0 ${completenessTextClass}`} />
                <p className="font-data text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Completion
                </p>
              </div>
              <p className={`font-heading text-lg font-semibold tabular-nums ${completenessTextClass}`}>{completeness}%</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-500 ${completenessBarClass}`}
                style={{ width: `${completeness}%` }}
              />
            </div>
            {missing.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {missing.slice(0, 4).map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <AlertCircle className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="font-data text-[10px] text-muted-foreground">{item}</span>
                  </div>
                ))}
                {missing.length > 4 && (
                  <span className="font-data text-[10px] text-muted-foreground">+{missing.length - 4} more</span>
                )}
              </div>
            )}
            <Link href="/onboarding" className="inline-flex font-body text-xs text-foreground underline-offset-4 hover:underline">
              Update profile
            </Link>
          </CardContent>
        </Card>
      )}

      {completeness === 100 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
          <CheckCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="font-body text-sm text-muted-foreground">All checklist items are complete.</p>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

        {/* Left column */}
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center gap-4 p-6 pt-6">
              {isStudent ? (
                <Avatar className="h-28 w-28 border-2 border-border shadow-sm">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-muted text-2xl font-semibold text-foreground">
                    {getInitials(profile?.full_name || "?")}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border-2 border-border bg-muted">
                  {(recruiterProfile as any)?.logo_url ? (
                    <img
                      src={(recruiterProfile as any).logo_url}
                      className="h-full w-full object-cover"
                      alt="Company logo"
                    />
                  ) : (
                    <Building2 className="h-14 w-14 text-muted-foreground" />
                  )}
                </div>
              )}

              <div className="w-full text-center">
                <h2 className="font-heading text-xl font-semibold text-foreground">
                  {isRecruiter ? (recruiterProfile as any)?.company_name || profile?.full_name : profile?.full_name}
                </h2>
                <p className="mt-0.5 flex items-center justify-center gap-1 font-body text-sm text-muted-foreground">
                  <Mail className="h-3 w-3 shrink-0" />
                  {user.email}
                </p>
                {isStudent && (studentProfile as any)?.university && (
                  <p className="mt-1 flex items-center justify-center gap-1 font-body text-sm text-muted-foreground">
                    <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                    {(studentProfile as any).university}
                  </p>
                )}
                {isRecruiter && (
                  <div className="mt-2">
                    {(recruiterProfile as any)?.is_approved ? (
                      <Badge variant="secondary" className="font-data text-[10px] uppercase tracking-wide">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="font-data text-[10px] uppercase tracking-wide text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending review
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="space-y-3 p-5 pt-5">
              <p className="font-data text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Activity</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="font-body text-sm text-foreground">{isStudent ? "Applications" : "Jobs posted"}</p>
                  </div>
                  <p className="font-heading text-sm font-semibold tabular-nums text-foreground">{activityCount ?? 0}</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="font-body text-sm text-foreground">Matches</p>
                  </div>
                  <p className="font-heading text-sm font-semibold tabular-nums text-foreground">{matchCount ?? 0}</p>
                </div>
                {isStudent && (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="font-body text-sm text-foreground">Saved</p>
                    </div>
                    <p className="font-heading text-sm font-semibold tabular-nums text-foreground">{savedCount ?? 0}</p>
                  </div>
                )}
                {isStudent && activityCount && activityCount > 0 ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="font-body text-sm text-foreground">Match rate</p>
                    </div>
                    <p className="font-heading text-sm font-semibold tabular-nums text-muted-foreground">
                      {Math.round(((matchCount || 0) / activityCount) * 100)}%
                    </p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {isStudent && (
            <Card className="shadow-sm">
              <CardContent className="space-y-2.5 p-5 pt-5">
                <p className="font-data text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Links</p>
                {(studentProfile as any)?.linkedin_url && (
                  <a
                    href={(studentProfile as any).linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-body text-sm text-foreground underline-offset-4 hover:underline"
                  >
                    <Linkedin className="h-4 w-4 shrink-0 text-muted-foreground" />
                    LinkedIn
                  </a>
                )}
                {(studentProfile as any)?.github_url && (
                  <a
                    href={(studentProfile as any).github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-body text-sm text-foreground underline-offset-4 hover:underline"
                  >
                    <Github className="h-4 w-4 shrink-0 text-muted-foreground" />
                    GitHub
                  </a>
                )}
                {(studentProfile as any)?.resume_url && (
                  <a
                    href={(studentProfile as any).resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-body text-sm text-foreground underline-offset-4 hover:underline"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    Resume
                  </a>
                )}
                {!(studentProfile as any)?.linkedin_url &&
                  !(studentProfile as any)?.github_url &&
                  !(studentProfile as any)?.resume_url && (
                    <div className="space-y-1">
                      <p className="font-body text-xs text-muted-foreground">None added.</p>
                      <Link href="/onboarding" className="font-body text-xs text-primary underline-offset-4 hover:underline">
                        Add in onboarding
                      </Link>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          {isRecruiter && (recruiterProfile as any)?.website_url && (
            <Card className="shadow-sm">
              <CardContent className="p-5 pt-5">
                <p className="mb-2 font-data text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Website
                </p>
                  <a
                  href={(recruiterProfile as any).website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 truncate font-body text-sm text-foreground underline-offset-4 hover:underline"
                >
                  <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {(recruiterProfile as any).website_url}
                </a>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardContent className="p-6 pt-6">
              <h3 className="mb-3 font-data text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">About</h3>
              {profile?.bio ? (
                <p className="font-body text-sm leading-relaxed text-foreground">{profile.bio}</p>
              ) : (
                <div className="space-y-2">
                  <p className="font-body text-sm text-muted-foreground">No bio listed.</p>
                  <Link
                    href="/onboarding"
                    className="inline-flex items-center gap-1 font-body text-xs text-foreground underline-offset-4 hover:underline"
                  >
                    <Edit className="h-3 w-3" />
                    Add in onboarding
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile video (upload or record) */}
          <ProfileVideoBlock
            userId={user.id}
            initialVideoUrl={(profile as any)?.profile_video_url ?? null}
          />

          {/* Student sections */}
          {isStudent && (
            <>
              <Card className="shadow-sm">
                <CardContent className="p-6 pt-6">
                  <h3 className="mb-3 font-data text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Education
                  </h3>
                  {(studentProfile as any)?.degree || (studentProfile as any)?.university ? (
                    <div className="space-y-1.5">
                      {(studentProfile as any)?.university && (
                        <p className="font-heading font-semibold text-foreground">{(studentProfile as any).university}</p>
                      )}
                      {(studentProfile as any)?.degree && (
                        <p className="font-body text-sm text-muted-foreground">{(studentProfile as any).degree}</p>
                      )}
                      {(studentProfile as any)?.graduation_year && (
                        <p className="flex items-center gap-1.5 font-body text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          Class of {(studentProfile as any).graduation_year}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-body text-sm text-muted-foreground">No education listed.</p>
                      <Link
                        href="/onboarding"
                        className="inline-flex items-center gap-1.5 font-body text-xs text-foreground underline-offset-4 hover:underline"
                      >
                        <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                        Add in onboarding
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-6 pt-6">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="font-data text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Skills
                    </h3>
                    {(studentProfile as any)?.skills?.length > 0 ? (
                      <span className="font-data text-[10px] text-muted-foreground">
                        {(studentProfile as any).skills.length} listed
                      </span>
                    ) : null}
                  </div>
                  {(studentProfile as any)?.skills?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(studentProfile as any).skills.map((s: string) => (
                        <span
                          key={s}
                          className="rounded-md border border-border bg-muted/30 px-2.5 py-1 font-data text-xs text-foreground"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-body text-sm text-muted-foreground">No skills listed.</p>
                      <Link
                        href="/onboarding"
                        className="inline-flex items-center gap-1.5 font-body text-xs text-foreground underline-offset-4 hover:underline"
                      >
                        <Tag className="h-3.5 w-3.5 shrink-0" />
                        Add in onboarding
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {(studentProfile as any)?.preferred_job_categories?.length > 0 && (
                <Card className="shadow-sm">
                  <CardContent className="p-6 pt-6">
                    <h3 className="mb-3 font-data text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Job interests
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(studentProfile as any).preferred_job_categories.map((c: string) => (
                        <span
                          key={c}
                          className="rounded-md border border-border bg-muted/20 px-2.5 py-1 font-data text-xs text-foreground"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Recruiter sections */}
          {isRecruiter && (
            <Card className="shadow-sm">
              <CardContent className="space-y-4 p-6 pt-6">
                <h3 className="font-data text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Company
                </h3>
                {(recruiterProfile as any)?.description ? (
                  <p className="font-body text-sm leading-relaxed text-foreground">{(recruiterProfile as any).description}</p>
                ) : (
                  <p className="font-body text-sm text-muted-foreground">No company description.</p>
                )}
                {(recruiterProfile as any)?.hiring_focus && (
                  <div>
                    <p className="mb-1 font-data text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Hiring focus
                    </p>
                    <p className="font-body text-sm text-foreground">{(recruiterProfile as any).hiring_focus}</p>
                  </div>
                )}
                {!(recruiterProfile as any)?.description && !(recruiterProfile as any)?.hiring_focus && (
                  <Link
                    href="/onboarding"
                    className="inline-flex items-center gap-1 font-body text-xs text-foreground underline-offset-4 hover:underline"
                  >
                    <Building2 className="h-3 w-3" />
                    Add in onboarding
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick links */}
          <QuickActions isStudent={isStudent} />
        </div>
      </div>
    </div>
  )
}
