import { createClient } from "@/lib/supabase/server"
import { AppNav } from "@/components/nav/AppNav"
import type { UserRole } from "@/types"
import { NotificationBell } from "@/components/nav/NotificationBell"

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
    <div className="min-h-screen apple-grouped-bg text-[#1d1d1f] flex selection:bg-[#0071e3]/15">
      <AppNav
        role={role}
        fullName={fullName}
        email={user?.email ?? null}
        avatarUrl={avatarUrl}
      />

      <div className="flex-1 lg:ml-56 min-h-screen flex flex-col apple-grouped-bg">
        <div className="hidden lg:flex h-[52px] shrink-0 items-center border-b border-[rgba(60,60,67,0.12)] bg-white/72 backdrop-blur-2xl backdrop-saturate-180 sticky top-0 z-30 px-6 supports-[backdrop-filter]:bg-white/65">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="text-right">
              <p className="font-body text-sm font-semibold text-[#1d1d1f] leading-none tracking-tight">
                {fullName ?? user?.email?.split("@")[0]}
              </p>
              <p className="font-body text-[11px] text-[#86868b] mt-1 capitalize">
                {role}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#f5f5f7] border border-[rgba(60,60,67,0.12)] flex items-center justify-center text-[#1d1d1f] font-semibold text-sm shrink-0 shadow-sm">
              {(fullName ?? user?.email ?? "?").charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <main className="flex-1 pt-16 pb-24 lg:pt-0 lg:pb-0 overflow-y-auto apple-grouped-bg">
          <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-screen-xl mx-auto w-full min-h-[calc(100vh-6rem)] lg:min-h-[calc(100vh-3.5rem)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
