import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDate, getInitials } from "@/lib/utils"
import { Users, GraduationCap, Building2, Shield, TrendingUp, Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: currentProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (currentProfile?.role !== "admin") redirect("/discover")

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  const students = (profiles || []).filter(p => p.role === "student")
  const recruiters = (profiles || []).filter(p => p.role === "recruiter")
  const admins = (profiles || []).filter(p => p.role === "admin")

  // Signups in last 7 days
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const newThisWeek = (profiles || []).filter(p => p.created_at > weekAgo).length

  const roleBadge = (role: string) => {
    if (role === "admin") return "bg-[#FFD600]/15 border-[#FFD600]/30 text-[#FFD600]"
    if (role === "recruiter") return "bg-[#F7931A]/15 border-[#F7931A]/30 text-[#F7931A]"
    return "bg-white/5 border-white/15 text-[#94A3B8]"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-white">User Management</h1>
          <p className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8] mt-0.5">
            {profiles?.length || 0} total users
          </p>
        </div>
        <Link href="/admin" className="flex items-center gap-1.5 font-body text-xs text-[#94A3B8] hover:text-white transition-colors">
          ← Overview
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Users", value: profiles?.length || 0, icon: Users, color: "#F7931A" },
          { label: "Students", value: students.length, icon: GraduationCap, color: "#94A3B8" },
          { label: "Recruiters", value: recruiters.length, icon: Building2, color: "#FFD600" },
          { label: "New This Week", value: newThisWeek, icon: TrendingUp, color: "#22c55e" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl bg-[#0F1115] border border-white/8 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-data text-[9px] tracking-wider uppercase text-[#94A3B8]">{label}</p>
              <Icon className="h-3.5 w-3.5" style={{ color }} />
            </div>
            <p className="font-heading font-bold text-2xl" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Role composition bar */}
      {(profiles?.length || 0) > 0 && (
        <div className="rounded-xl bg-[#0F1115] border border-white/8 p-4 space-y-3">
          <p className="font-data text-[10px] tracking-widest uppercase text-[#94A3B8]">User Composition</p>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
            {students.length > 0 && (
              <div
                className="bg-[#94A3B8] h-full rounded-l-full"
                style={{ width: `${Math.round((students.length / (profiles?.length || 1)) * 100)}%` }}
                title={`Students: ${students.length}`}
              />
            )}
            {recruiters.length > 0 && (
              <div
                className="bg-[#F7931A] h-full"
                style={{ width: `${Math.round((recruiters.length / (profiles?.length || 1)) * 100)}%` }}
                title={`Recruiters: ${recruiters.length}`}
              />
            )}
            {admins.length > 0 && (
              <div
                className="bg-[#FFD600] h-full rounded-r-full"
                style={{ width: `${Math.round((admins.length / (profiles?.length || 1)) * 100)}%` }}
                title={`Admins: ${admins.length}`}
              />
            )}
          </div>
          <div className="flex items-center gap-4 font-data text-[9px] tracking-wider uppercase">
            <span className="flex items-center gap-1.5 text-[#94A3B8]">
              <span className="w-2 h-2 rounded-full bg-[#94A3B8]" />Students ({students.length})
            </span>
            <span className="flex items-center gap-1.5 text-[#F7931A]">
              <span className="w-2 h-2 rounded-full bg-[#F7931A]" />Recruiters ({recruiters.length})
            </span>
            {admins.length > 0 && (
              <span className="flex items-center gap-1.5 text-[#FFD600]">
                <span className="w-2 h-2 rounded-full bg-[#FFD600]" />Admins ({admins.length})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="rounded-xl bg-[#0F1115] border border-white/8 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <p className="font-data text-[10px] tracking-widest uppercase text-[#94A3B8]">All Users</p>
          <p className="font-data text-[10px] text-[#94A3B8]">Newest first</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-2.5 font-data text-[9px] tracking-widest uppercase text-[#94A3B8]">User</th>
                <th className="text-left px-4 py-2.5 font-data text-[9px] tracking-widest uppercase text-[#94A3B8]">Role</th>
                <th className="text-left px-4 py-2.5 font-data text-[9px] tracking-widest uppercase text-[#94A3B8] hidden sm:table-cell">Joined</th>
                <th className="text-left px-4 py-2.5 font-data text-[9px] tracking-widest uppercase text-[#94A3B8] hidden md:table-cell">Email</th>
              </tr>
            </thead>
            <tbody>
              {profiles?.map((profile) => (
                <tr key={profile.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8 border border-white/10 shrink-0">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="bg-[#030304] text-[#F7931A] text-xs font-bold">
                          {getInitials(profile.full_name || "?")}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-body font-medium text-sm text-white truncate max-w-[120px]">
                        {profile.full_name || "—"}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-data text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full border ${roleBadge(profile.role || "")}`}>
                      {profile.role || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-data text-[10px] text-[#94A3B8] hidden sm:table-cell whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(profile.created_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-data text-[10px] text-[#94A3B8] hidden md:table-cell max-w-[200px] truncate">
                    {profile.id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!profiles?.length && (
          <div className="text-center py-12 space-y-2">
            <Users className="h-8 w-8 text-[#94A3B8] mx-auto" />
            <p className="font-body text-sm text-[#94A3B8]">No users found</p>
          </div>
        )}
      </div>

      {/* Quick nav */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Approve Recruiters", href: "/admin/recruiters", icon: Building2 },
          { label: "Manage Channels", href: "/admin/channels", icon: Shield },
          { label: "Back to Overview", href: "/admin", icon: ArrowRight },
        ].map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/8 text-[#94A3B8] hover:border-white/20 hover:text-white transition-all duration-200 font-body text-sm">
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
