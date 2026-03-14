import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDate, getInitials } from "@/lib/utils"
import { Users } from "lucide-react"

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: currentProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (currentProfile?.role !== "admin") redirect("/discover")

  const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  const students = profiles?.filter(p => p.role === "student").length || 0
  const recruiters = profiles?.filter(p => p.role === "recruiter").length || 0

  const roleBadge = (role: string) => {
    if (role === "admin") return "bg-[#FFD600]/15 border-[#FFD600]/30 text-[#FFD600]"
    if (role === "recruiter") return "bg-[#F7931A]/15 border-[#F7931A]/30 text-[#F7931A]"
    return "bg-white/5 border-white/15 text-[#94A3B8]"
  }

  return (
    <div className="space-y-5 p-4 max-w-4xl bg-[#030304] min-h-screen">
      <div>
        <h1 className="font-heading font-bold text-2xl text-white">User Management</h1>
        <p className="font-data text-[11px] tracking-wider uppercase text-[#94A3B8] mt-0.5">{profiles?.length || 0} total users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: profiles?.length || 0, accent: "#F7931A" },
          { label: "Students", value: students, accent: "#FFD600" },
          { label: "Recruiters", value: recruiters, accent: "#EA580C" },
        ].map(({ label, value, accent }) => (
          <div key={label} className="rounded-xl bg-[#0F1115] border border-white/8 p-4 text-center">
            <p className="font-heading font-bold text-2xl" style={{ color: accent }}>{value}</p>
            <p className="font-data text-[10px] tracking-wider uppercase text-[#94A3B8] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-[#0F1115] border border-white/8 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left p-3 font-data text-[10px] tracking-widest uppercase text-[#94A3B8]">User</th>
              <th className="text-left p-3 font-data text-[10px] tracking-widest uppercase text-[#94A3B8]">Role</th>
              <th className="text-left p-3 font-data text-[10px] tracking-widest uppercase text-[#94A3B8] hidden sm:table-cell">Joined</th>
            </tr>
          </thead>
          <tbody>
            {profiles?.map((profile) => (
              <tr key={profile.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 border border-white/10">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="bg-[#030304] text-[#F7931A] text-xs font-bold">
                        {getInitials(profile.full_name || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-body font-medium text-sm text-white">{profile.full_name || "—"}</p>
                  </div>
                </td>
                <td className="p-3">
                  <span className={`font-data text-[9px] tracking-widest uppercase px-2 py-1 rounded-full border ${roleBadge(profile.role || "")}`}>
                    {profile.role}
                  </span>
                </td>
                <td className="p-3 font-data text-[10px] text-[#94A3B8] hidden sm:table-cell">{formatDate(profile.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!profiles?.length && (
          <div className="text-center py-12">
            <Users className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
            <p className="font-body text-sm text-[#94A3B8]">No users found</p>
          </div>
        )}
      </div>
    </div>
  )
}
