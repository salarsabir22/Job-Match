import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Users, Building2, Hash, Heart, Briefcase, TrendingUp,
  CheckCircle, Clock, AlertTriangle, ArrowRight, Zap, MessageCircle, Shield
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"

export default async function AdminOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: currentProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (currentProfile?.role !== "admin") redirect("/discover")

  // Fetch all platform metrics in parallel
  const [
    profilesRes,
    jobsRes,
    matchesRes,
    channelsRes,
    pendingRecruitersRes,
    recentUsersRes,
  ] = await Promise.all([
    supabase.from("profiles").select("role, created_at"),
    supabase.from("jobs").select("is_active", { count: "exact" }),
    supabase.from("matches").select("id", { count: "exact", head: true }),
    supabase.from("community_channels").select("id, name, channel_members(user_id)"),
    supabase.from("recruiter_profiles").select("id, company_name, is_approved, profiles(full_name, created_at)").eq("is_approved", false).order("created_at", { ascending: false }).limit(5),
    supabase.from("profiles").select("id, full_name, avatar_url, role, created_at").order("created_at", { ascending: false }).limit(8),
  ])

  const allProfiles = profilesRes.data || []
  const students = allProfiles.filter(p => p.role === "student").length
  const recruiters = allProfiles.filter(p => p.role === "recruiter").length
  const admins = allProfiles.filter(p => p.role === "admin").length

  const allJobs = jobsRes.data || []
  const activeJobs = allJobs.filter(j => (j as any).is_active).length

  const totalMatches = matchesRes.count || 0
  const totalChannels = (channelsRes.data || []).length
  const totalMembers = (channelsRes.data || []).reduce((sum, ch) => sum + (ch.channel_members?.length || 0), 0)

  const pendingRecruiters = pendingRecruitersRes.data || []
  const recentUsers = recentUsersRes.data || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-black">Admin Dashboard</h1>
          <p className="font-data text-[11px] tracking-wider uppercase text-neutral-700 mt-0.5">
            Platform overview · {allProfiles.length} total users
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#D4D4D4]/10 border border-[#D4D4D4]/25">
          <Shield className="h-3.5 w-3.5 text-[#D4D4D4]" />
          <span className="font-data text-[10px] tracking-wider uppercase text-[#D4D4D4]">Admin</span>
        </div>
      </div>

      {/* Pending approvals alert */}
      {pendingRecruiters.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FAFAFA]/8 border border-[#FAFAFA]/30">
          <AlertTriangle className="h-4 w-4 text-neutral-900 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-data text-[10px] tracking-widest uppercase text-neutral-900 mb-0.5">Action Required</p>
            <p className="font-body text-sm text-neutral-700">
              {pendingRecruiters.length} recruiter{pendingRecruiters.length > 1 ? "s" : ""} waiting for approval
            </p>
          </div>
          <Link href="/admin/recruiters" className="flex items-center gap-1 font-body text-xs text-neutral-900 hover:text-neutral-600 transition-colors shrink-0">
            Review <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Platform KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Users", value: allProfiles.length, icon: Users, color: "#FAFAFA", href: "/admin/users" },
          { label: "Active Jobs", value: activeJobs, icon: Briefcase, color: "#D4D4D4", href: "/jobs" },
          { label: "Total Matches", value: totalMatches, icon: Heart, color: "#525252", href: "/admin/users" },
          { label: "Channels", value: totalChannels, icon: Hash, color: "#94A3B8", href: "/admin/channels" },
        ].map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href}>
            <div className="rounded-xl bg-white border border-black/10 p-4 hover:border-white/15 transition-all duration-200 cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <p className="font-data text-[9px] tracking-wider uppercase text-neutral-700">{label}</p>
                <Icon className="h-3.5 w-3.5" style={{ color }} />
              </div>
              <p className="font-heading font-bold text-2xl" style={{ color }}>{value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* User breakdown + Community stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User breakdown */}
        <div className="rounded-xl bg-white border border-black/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-neutral-900" />
              <p className="font-data text-[11px] tracking-wider uppercase text-neutral-700">User Breakdown</p>
            </div>
            <Link href="/admin/users" className="font-data text-[9px] tracking-wider uppercase text-neutral-900 hover:text-neutral-600 transition-colors">
              Manage →
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { label: "Students", value: students, total: allProfiles.length, color: "#94A3B8" },
              { label: "Recruiters", value: recruiters, total: allProfiles.length, color: "#FAFAFA" },
              { label: "Admins", value: admins, total: allProfiles.length, color: "#D4D4D4" },
            ].map(({ label, value, total, color }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-body text-sm text-neutral-700">{label}</p>
                  <p className="font-heading font-bold text-sm" style={{ color }}>{value}</p>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: total > 0 ? `${Math.round((value / total) * 100)}%` : "0%", background: color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform activity */}
        <div className="rounded-xl bg-white border border-black/10 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-neutral-900" />
            <p className="font-data text-[11px] tracking-wider uppercase text-neutral-700">Platform Activity</p>
          </div>
          <div className="space-y-3">
            {[
              { label: "Total jobs posted", value: allJobs.length, icon: Briefcase, color: "#D4D4D4" },
              { label: "Active job listings", value: activeJobs, icon: Zap, color: "#FAFAFA" },
              { label: "Mutual matches made", value: totalMatches, icon: Heart, color: "#525252" },
              { label: "Community members", value: totalMembers, icon: MessageCircle, color: "#94A3B8" },
              { label: "Pending approvals", value: pendingRecruiters.length, icon: Clock, color: pendingRecruiters.length > 0 ? "#D4D4D4" : "#94A3B8" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5" style={{ color }} />
                  <p className="font-body text-sm text-neutral-700">{label}</p>
                </div>
                <p className="font-heading font-bold text-sm" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending recruiter approvals */}
      {pendingRecruiters.length > 0 && (
        <div className="rounded-xl bg-white border border-black/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#D4D4D4]" />
              <p className="font-data text-[11px] tracking-wider uppercase text-neutral-700">Pending Approvals</p>
            </div>
            <Link href="/admin/recruiters" className="font-data text-[9px] tracking-wider uppercase text-neutral-900 hover:text-neutral-600 transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {pendingRecruiters.map((recruiter: any) => (
              <div key={recruiter.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/[0.02] border border-black/10">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-neutral-200 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-black" />
                  </div>
                  <div>
                    <p className="font-body text-sm text-black font-medium">{recruiter.company_name}</p>
                    <p className="font-data text-[10px] text-neutral-700">{recruiter.profiles?.full_name} · {formatDate(recruiter.profiles?.created_at)}</p>
                  </div>
                </div>
                <span className="font-data text-[9px] tracking-widest uppercase px-2 py-1 rounded-full bg-[#D4D4D4]/10 border border-[#D4D4D4]/25 text-[#D4D4D4] shrink-0">
                  Pending
                </span>
              </div>
            ))}
          </div>
          <Link href="/admin/recruiters"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-black text-white font-body font-semibold text-sm shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.6)] transition-all duration-300">
            Review & Approve Recruiters <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Recent users */}
      <div className="rounded-xl bg-white border border-black/10 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-black/10">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-neutral-900" />
            <p className="font-data text-[11px] tracking-wider uppercase text-neutral-700">Recent Signups</p>
          </div>
          <Link href="/admin/users" className="font-data text-[9px] tracking-wider uppercase text-neutral-900 hover:text-neutral-600 transition-colors">
            All users →
          </Link>
        </div>
        <div className="divide-y divide-white/5">
          {recentUsers.map((u: any) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.015] transition-colors">
              <Avatar className="h-8 w-8 border border-black/10">
                <AvatarImage src={u.avatar_url || undefined} />
                <AvatarFallback className="bg-white text-neutral-900 text-xs font-bold">
                  {getInitials(u.full_name || "?")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-black truncate">{u.full_name || "—"}</p>
                <p className="font-data text-[10px] text-neutral-700">{formatDate(u.created_at)}</p>
              </div>
              <span className={`font-data text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                u.role === "admin"
                  ? "bg-[#D4D4D4]/15 border-[#D4D4D4]/30 text-[#D4D4D4]"
                  : u.role === "recruiter"
                  ? "bg-[#FAFAFA]/15 border-[#FAFAFA]/30 text-neutral-900"
                  : "bg-white/5 border-white/15 text-neutral-700"
              }`}>
                {u.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Manage Users", desc: "View all accounts, roles, and join dates", href: "/admin/users", icon: Users, color: "#FAFAFA" },
          { label: "Approve Recruiters", desc: "Review and activate recruiter applications", href: "/admin/recruiters", icon: Building2, color: "#D4D4D4" },
          { label: "Manage Channels", desc: "Create, edit, and delete community channels", href: "/admin/channels", icon: Hash, color: "#525252" },
        ].map(({ label, desc, href, icon: Icon, color }) => (
          <Link key={href} href={href}>
            <div className="rounded-xl bg-white border border-black/10 p-4 hover:border-[#FAFAFA]/25 hover:shadow-[0_0_15px_-5px_rgba(255,255,255,0.1)] transition-all duration-300 h-full">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <p className="font-heading font-semibold text-sm text-black mb-1">{label}</p>
              <p className="font-body text-xs text-neutral-700 leading-relaxed">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
