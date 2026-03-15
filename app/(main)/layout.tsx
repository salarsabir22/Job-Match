import { createClient } from "@/lib/supabase/server"
import { AppNav } from "@/components/nav/AppNav"
import type { UserRole } from "@/types"

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role: UserRole | "admin" = "student"
  let fullName: string | null = null
  let avatarUrl: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name, avatar_url")
      .eq("id", user.id)
      .single()
    role      = (profile?.role as UserRole | "admin") || "student"
    fullName  = profile?.full_name ?? null
    avatarUrl = profile?.avatar_url ?? null
  }

  return (
    <div className="min-h-screen bg-[#030304] flex">
      <AppNav
        role={role}
        fullName={fullName}
        email={user?.email ?? null}
        avatarUrl={avatarUrl}
      />

      {/* Main content — offset by sidebar on desktop */}
      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Desktop top bar */}
        <div className="hidden lg:flex h-14 shrink-0 items-center border-b border-white/6 bg-[#030304]/80 backdrop-blur-sm sticky top-0 z-30 px-8">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-body text-sm font-medium text-white leading-none">{fullName ?? user?.email?.split("@")[0]}</p>
              <p className="font-data text-[10px] tracking-wider uppercase text-[#94A3B8] mt-0.5 capitalize">{role}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center text-white font-bold text-sm shadow-[0_0_12px_-2px_rgba(247,147,26,0.5)] shrink-0">
              {(fullName ?? user?.email ?? "?").charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 pt-16 pb-24 lg:pt-0 lg:pb-0 overflow-y-auto">
          <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-screen-xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
